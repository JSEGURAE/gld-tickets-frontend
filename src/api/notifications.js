import client from './client'

export const getNotificationSettings    = ()           => client.get('/notifications/settings').then(r => r.data)
export const updateNotificationSetting  = (priority, data) => client.put(`/notifications/settings/${priority}`, data).then(r => r.data)

export const getRecipients    = ()        => client.get('/notifications/recipients').then(r => r.data)
export const createRecipient  = (data)    => client.post('/notifications/recipients', data).then(r => r.data)
export const updateRecipient  = (id, data)=> client.put(`/notifications/recipients/${id}`, data).then(r => r.data)
export const deleteRecipient  = (id)      => client.delete(`/notifications/recipients/${id}`).then(r => r.data)
