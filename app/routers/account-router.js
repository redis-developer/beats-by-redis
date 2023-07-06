import { Router } from 'express'

import { accountRepository } from '../om/account-repository.js'

export const accountRouter = Router()

accountRouter.put('/:accountNumber', async (req, res) => {
  const accountNumber = req.params.accountNumber
  const accountData = req.body
  const account = await accountRepository.save(accountNumber, accountData)
  res.send(account)
})

accountRouter.get('/:accountNumber', async (req, res) => {

  req.session.lastAccessed = new Date()

  const accountNumber = req.params.accountNumber
  const account = await accountRepository.fetch(accountNumber)
  res.send(account)
})
