import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { z } from "zod";
import { OrchestrationInputSchema } from "./schemas";
import { fetchCustomerOrThrow, createOrder, confirmOrder, getOrderWithItems } from "./clients";
import { logInfo, logError } from "./logger";

const BadRequest = (error: string) => ({ statusCode: 400, body: JSON.stringify({ success: false, error }) });
const ServerError = (error: string) => ({ statusCode: 500, body: JSON.stringify({ success: false, error }) });

export const createAndConfirmOrder: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const correlationId =
      event.headers?.["x-correlation-id"] ||
      event.headers?.["X-Correlation-Id"] ||
      JSON.parse(event.body || "{}").correlation_id ||
      undefined;

    const parsed = OrchestrationInputSchema.safeParse(JSON.parse(event.body || "{}"));
    
    if (!parsed.success) {
        
        const formatted = zodErr(parsed.error)
            .map(e => `${e.path}: ${e.message}`)
            .join("; ");
        return BadRequest(formatted)
    }

    const { customer_id, items, idempotency_key } = parsed.data;

    logInfo("Orchestration started", { correlationId, customer_id, items_count: items.length });

    // 1) Validar cliente
    const customer = await fetchCustomerOrThrow(customer_id, correlationId);
    logInfo("Customer validated", { id: customer.id, correlationId });

    // 2) Crear orden (CREATED)
    const created = await createOrder({ customer_id, items }, correlationId);
    logInfo("Order created", { order_id: created.id, status: created.status, correlationId });

    // 3) Confirmar (idempotente)
    const confirmed = await confirmOrder(created.id, idempotency_key, correlationId);
    logInfo("Order confirmed", { order_id: confirmed.id, status: confirmed.status, correlationId });

    // 4) Obtener detalle con items (si confirmOrder ya retorna items, puedes saltar esto)
    const orderDetail = await getOrderWithItems(confirmed.id, correlationId);

    const responseBody = {
      success: true,
      correlationId,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        order: orderDetail
      }
    };

    return { statusCode: 201, body: JSON.stringify(responseBody) };
  } catch (err: any) {
    logError("Orchestration failed", { message: err?.message, stack: err?.stack });
    const msg = err?.message || "Internal error";
    if (msg.includes("not found") || msg.includes("Invalid payload")) {
      return BadRequest(msg);
    }
    return ServerError(msg);
  }
};

function zodErr(e: z.ZodError) {
  return e.issues.map(er => ({
    path: er.path.join("."),
    message: er.message
  }));
}
