import { ICustomersRepository } from "../ports/ICustomersRepository";

export class DeleteCustomerUseCase {
  constructor(private repo: ICustomersRepository) {}

  async execute(id: number) {
    return this.repo.deleteCustomer(id);
  }
}

