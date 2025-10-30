import { ICustomersRepository, UpdateCustomerInput } from "../ports/ICustomersRepository";

export class UpdateCustomerUseCase {
  constructor(private repo: ICustomersRepository) {}

  async execute(id: number, data: UpdateCustomerInput) {
    return this.repo.updateCustomer(id, data);
  }
}
