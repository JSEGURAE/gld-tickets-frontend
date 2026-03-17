import client from './client'

export const getCategories = (all = false) =>
  client.get('/categories', { params: all ? { all: 'true' } : {} }).then(r => r.data)

export const createCategory = (name) =>
  client.post('/categories', { name }).then(r => r.data)

export const updateCategory = (id, data) =>
  client.put(`/categories/${id}`, data).then(r => r.data)

export const deleteCategory = (id) =>
  client.delete(`/categories/${id}`).then(r => r.data)

export const createSubCategory = (categoryId, name) =>
  client.post(`/categories/${categoryId}/subcategories`, { name }).then(r => r.data)

export const updateSubCategory = (id, data) =>
  client.put(`/categories/subcategories/${id}`, data).then(r => r.data)

export const deleteSubCategory = (id) =>
  client.delete(`/categories/subcategories/${id}`).then(r => r.data)
