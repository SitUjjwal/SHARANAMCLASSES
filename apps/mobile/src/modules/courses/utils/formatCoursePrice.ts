/** Format INR price for course cards. */
export function formatCoursePrice(price: number): string {
  if (!price || price <= 0) {
    return 'Free';
  }
  return `₹${Math.round(price).toLocaleString('en-IN')}`;
}
