import { IOrdersRepository } from '../ports/IordersRepository'

export class ConfirmOrderUseCase {
  
    constructor(
        private ordersRepo: IOrdersRepository
    ) {}
 
    async execute(orderId: number) {
        
        if (!orderId) throw new Error('OrderId is required')
        
        return this.ordersRepo.confirmOrder(orderId)

    }
}
