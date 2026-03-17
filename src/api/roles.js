import client from './client'

export const getRoles = () => client.get('/roles').then(r => r.data)
