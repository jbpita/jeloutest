import { ICustomersRepository, CreateCustomerInput } from "../ports/ICustomersRepository";

export class CreateCustomerUseCase {
  constructor(private repo: ICustomersRepository) {}

  async execute(input: CreateCustomerInput) {
    if (!input.name || !input.email) throw new Error("Missing required fields");
    return this.repo.createCustomer(input);
  }
}
