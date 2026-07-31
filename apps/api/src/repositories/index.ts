/**
 * repositories/index.ts — export data-access adapters used by services.
 */
export {
  paymentOrderRepository,
  type IPaymentOrderRepository,
  type InsertPaymentOrderInput,
  type PaymentOrderRow,
} from './paymentOrder.repository';

export {
  purchasedCourseRepository,
  type IPurchasedCourseRepository,
  type InsertPurchasedCourseInput,
  type PurchasedCourseRow,
} from './purchasedCourse.repository';

export {
  productRepository,
  type IProductRepository,
  type ProductRow,
  type ProductType,
} from './product.repository';

export {
  purchaseRepository,
  type IPurchaseRepository,
  type PurchaseRow,
  type InsertPurchaseInput,
} from './purchase.repository';
