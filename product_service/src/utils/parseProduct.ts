import type { CSVProduct } from '../types/CSVproduct';

export function parseProduct(body: string): CSVProduct | null {
  const data = JSON.parse(body);

  const price = Number(data.price)
  const count = Number(data.count)

  if(!data.title || !data.description || Number.isNaN(price) || Number.isNaN(count)) {
    return null
  }

  return {
    title: data.title,
    description: data.description,
    price,
    count
  }
}
