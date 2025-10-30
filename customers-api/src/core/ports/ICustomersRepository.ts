export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ICustomersRepository {
  createCustomer(data: CreateCustomerInput): Promise<Customer>;
  getCustomerById(id: number): Promise<Customer | null>;
  updateCustomer(id: number, data: UpdateCustomerInput): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
  searchCustomers(search?: string, cursor?: number, limit?: number): Promise<Customer[]>;
}
