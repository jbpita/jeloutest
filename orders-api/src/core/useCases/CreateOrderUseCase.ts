import { IOrdersRepository, CreateOrderInput } from '../ports/IordersRepository';

export class CreateOrderUseCase {
  
    constructor(
        private ordersRepo: IOrdersRepository
    ) {}
    
    async execute(input: CreateOrderInput) {
        
        if (
            !input.customer_id ||
            !Array.isArray(input.items) ||
            input.items.length === 0
        ) {
            throw new Error('Invalid payload');
        }
        
        return this.ordersRepo.createOrder(input);
    }
}
