import nodemailer from 'nodemailer';

export default (() =>
	nodemailer.createTransport({
		name: 'www.yourdomain.com',
		service: 'gmail',
		host: 'smtp.gmail.com',
		port: 587,
		secure: true,
		auth: {
			user: process.env.MAIL_USER,
			pass: process.env.MAIL_PASSWORD,
		},
	}))();
