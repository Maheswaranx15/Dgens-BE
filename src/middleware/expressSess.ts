import expressSession from 'express-session';

const expressSess = expressSession({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: false,
})

export default expressSess