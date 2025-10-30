import { ICustomersRepository } from "../ports/ICustomersRepository";

export class GetCustomerUseCase {
  constructor(private repo: ICustomersRepository) {}

  async execute(id: number) {
    const customer = await this.repo.getCustomerById(id);
    if (!customer) throw new Error("Customer not found");
    return customer;
  }
}
