import { Router } from 'express';
import { login, register } from '../auth/account.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const session = await login(username, password);
    Object.assign(req.session, session);

    req.session.save(() => {
        res.redirect('/');
    });

  } catch (err) {
    res.status(401).send(err.message);
  }
});

authRouter.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const session = await register(username, password);
    Object.assign(req.session, session);

    req.session.save(() => {
        res.redirect('/');
    });
  } catch (err) {
    res.status(401).send(err.message);
  }
});
