import { getUserWithToken } from './account-authenticator.js';

async function getUserFromSession(req, res, next) {
  if (req.user) {
    next();
    return;
  }

  const user = await getUserWithToken(req.session);

  if (!user) {
    next();
    return;
  }

  req.user = {
    username: user.username,
  };

  next();
}

function requireUserForApi(req, res, next) {
  if (!req.user) {
    res.status(401).send('Unauthorized');
    return;
  }

  next();
}

function requireUserOrRedirect(req, res, next) {
  if (!req.user) {
    res.redirect('/login');
    return;
  }

  next();
}

export { getUserFromSession, requireUserForApi, requireUserOrRedirect };
