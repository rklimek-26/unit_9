'use strict';

const express = require('express');
const router = express.Router();

const User = require('./models').User;
const Course = require('./models').Course;

const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

const {
  check,
  validationResult
} = require('express-validator');

function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

//Authentication
const authenticateUser = async (req, res, next) => {
  let message = null;
  const users = await User.findAll();
  const credentials = auth(req);

  if (credentials) {
    // Look for a user whose `username` matches the credentials `name` property.
    const user = users.find(user => user.emailAddress === credentials.name);

    if (user) {
      const authenticated = bcryptjs
        .compareSync(credentials.pass, user.password);
      if (authenticated) {
        console.log(`Authentication successful for username: ${user.emailAddress}`);

        // Store the user on the Request object.
        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${user.emailAddress}`;
      }
    } else {
      message = `User not found for username: ${credentials.name}`;
    }
  } else {
    message = 'Auth header not found';
  }

  if (message) {
    console.warn(message);
    res.status(401).json({
      message: 'Access Denied'
    });
  } else {
    next();
  }
};


// Send a GET request to /users to READ a list of users
router.get('/users', authenticateUser, asyncHandler(async (req,res)=> {
    const authUser = req.currentUser;
    const user = await User.findByPk(authUser.id, {
        attributes: {
            exclude: [
                'password',
                'createdAt',
                'updatedAt'
            ]
        },
    });
    if(user){
        res.status(200).json(user);
    } else {
        res.status(400).json({
					message: "User not found"
				});
    }

}));

// Send a POST request to /users
router.post('/users', asyncHandler(async (req,res)=> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        res.status(400).json({ errors: errorMessages });
    } else {
        const user = req.body;
        if(user.password){
            user.password = bcryptjs.hashSync(user.password);
        }
        await User.create(req.body);
        res.status(201).location('/').end();
    }

}));


// Send a GET request to /courses
router.get('/courses', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({

//Excedes Expectations
	attributes: {
      exclude: [
        'createdAt',
        'updatedAt'
      ]
    },
    include: [{
        model: User,
        attributes: {
          exclude: [
            'password',
            'createdAt',
            'updatedAt'
          ]
        },
      },

    ],
  });
  res.json(courses);
}));

//Send a GET request to /courses:id
router.get('/courses/:id', asyncHandler(async (req, res) => {

  const courses = await Course.findByPk(req.params.id, {
//Excedes Expectations
	  attributes: {
      exclude: [
        'createdAt',
        'updatedAt'
      ]
    },
    include: [{
      model: User,
      attributes: {
        exclude: [
          'password',
          'createdAt',
          'updatedAt'
        ]
      },
    }, ],
  });
  res.status(200).json(courses);
}));

// Send a POST request to /courses to create a new course
router.post('/courses', authenticateUser, asyncHandler(async (req,res)=> {
	try {
		const course = await Course.create(req.body);
		res.status(201).location('/courses/' + course.id).end();
	} catch (error) {
		if(error.name ==='SequelizeValidationError')
			 {const errors = error.errors.map(err=>err.message);
			 res.status(400).json({errors});
			 }else{
					 throw error;
			 }
	 }
}));

// Send a PUT request to /courses to update an existing course
router.put('/courses/:id', authenticateUser, [
	check('title').exists().withMessage('Please populate title!'),
	check('description').exists().withMessage('Please populate description!'),
	check('userId').exists().withMessage('Please populate User Id!')],
	asyncHandler(async(req,res) => {
		const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        res.status(400).json({ errors: errorMessages });
			} else {
         const authUser = req.currentUser;
         const course = await Course.findByPk(req.params.id);
//Excedes Expectations
				 if(authUser.id === course.userId){
             await course.update(req.body);
             res.status(204).end();
         } else {
            res.status(403).json({message: "Unfortunatley you can only make changes to your own courses."});
         }
     }
 }));

 // Send a DELETE request to /courses/:id to update an existing course
 router.delete("/courses/:id", authenticateUser, asyncHandler(async(req,res, next) => {
	 const authUser = req.currentUser;
	 const course = await Course.findByPk(req.params.id);
	 if (course) {
//Excedes Expectations
		 if(authUser.id === course.userId){
			 await course.destroy();
			 res.status(204).end();
		 } else {
		 		res.status(403).json({message: "Unfortunatley you can only delete to your own courses."});
		 }
	 }else {
		 next()
	 }
}));





module.exports = router;
