const getAuth = require('./auth');
const getToken = require('./utils/token');
const getPassword = require('./utils/password');

const defaultHook = (source, args, context) => {
  if (!context.user) throw new Error('Must be authenticated');
  return Promise.resolve(args);
};
module.exports = (schema, { adapter, secret, mail, attributes = '', Query, Mutation } = {}) => {
  const token = getToken({ secret });
  const password = getPassword({ });
  const auth = getAuth({ adapter, password, token, mail, confirm: false });

  schema.addSchema({
    name: 'user',
    query: `
      checkToken(token: String): Boolean
      verify(token: String): userAndToken
      verifyCookie: user
      userList: [user]
      user(id: String): user
    `,
    mutation: `
      confirm(token: String): Boolean
      forgot(email: String): Boolean
      register(input: userInput, password: String): user
      reset(token: String, password: String): Boolean
      login(email: String, password: String): userAndToken
      loginCookie(email: String, password: String): user
      logoutCookie: Boolean
      user(input: userInput, operationType: OPERATION_TYPE): user
    `,
    resolvers: {
      Query: {
        checkToken: (source, args) => auth.checkToken(args.token),
        verifyCookie: (source, args, context) => context.session && context.session.userId && auth.getUser(context.session.userId),
        verify: (source, args) => auth.verify(args.token),
        userList: (source, args, context) => {
          const hook = Query && Query.userList ? Query.userList : defaultHook;
          return hook(source, Object.assign({}, args), context).then(item => adapter.list('user', item));
        },
        user: (source, args, context) => {
          const hook = Query && Query.user ? Query.user : defaultHook;
          return hook(source, Object.assign({}, args), context).then(item => adapter.read('user', item));
        },
      },
      Mutation: {
        forgot: (source, args) => auth.forgot(args.email),
        reset: (source, args) => auth.reset(args.token, args.password).then(() => true),
        loginCookie: (source, args, context) => {
          return auth.login(args.email, args.password).then((userAndToken) => {
            context.session.userId = userAndToken.user.id; // eslint-disable-line no-param-reassign
            return userAndToken.user;
          });
        },
        logoutCookie: (source, args, context) => {
          delete context.session.userId; // eslint-disable-line no-param-reassign
          return true;
        },
        login: (source, args) => auth.login(args.email, args.password),
        register: (source, args) => auth.register(args.input, args.password).then(x => x.user),
        confirm: (source, args) => auth.confirm(args.token),
        user: (source, args, context) => {
          const hook = Mutation && Mutation.user ? Mutation.user : defaultHook;
          return hook(source, Object.assign({}, args), context).then((args) => { // eslint-disable-line no-shadow
            if (args.operationType && args.operationType === 'REMOVE') {
              return adapter.remove('user', Object.assign({}, args));
            } else if (args.input) {
              args = Object.assign({}, args, args.input); // eslint-disable-line no-param-reassign
              delete args.input; // eslint-disable-line no-param-reassign
            }
            delete args.operationType; // eslint-disable-line no-param-reassign
            return adapter.write('user', args, { attributes });
          });
        },
      },
    },
    typeDefs: {
      user: `
        type {
          id: String
          email: String
          token: String
          name: String
          ${attributes}
        }
      `,
      userAndToken: `
        type {
          user: user
          token: String
        }
      `,
    },
  });
  return { auth };
};
