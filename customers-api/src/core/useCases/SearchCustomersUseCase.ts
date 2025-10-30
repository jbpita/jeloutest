import { ICustomersRepository } from "../ports/ICustomersRepository";

export class SearchCustomersUseCase {
  constructor(private repo: ICustomersRepository) {}

  async execute(search?: string, cursor?: number, limit: number = 10) {
    return this.repo.searchCustomers(search, cursor, limit);
  }
}
