import client from './client'

export const getSedes     = (all = false) => client.get('/sedes', { params: all ? { all: 'true' } : {} }).then(r => r.data)
export const createSede   = (data)        => client.post('/sedes', data).then(r => r.data)
export const updateSede   = (id, data)    => client.put(`/sedes/${id}`, data).then(r => r.data)
export const deleteSede   = (id)          => client.delete(`/sedes/${id}`).then(r => r.data)
