const express = require("express");
const router = express.Router();

const { setTokenCookie, restoreUser, requireAuth } = require("../../utils/auth");
const { User, Spot, Review, ReviewImage, SpotImage, Booking, Sequelize } = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const { Op } = require("sequelize");

//GET ALL SPOTS
router.get("/", async (req, res) => {
  let { page, size, maxLat, minLat, minLng, maxLng, minPrice, maxPrice } = req.query;

  const err = {
    message: "Validation Error",
    statusCode: 400,
    errors: {}
  }

  let hasError = false

  page = parseInt(page);
  size = parseInt(size);

  if (!page) page = 1;
  if (page >= 10) page = 10;
  if (!size || size >= 20) size = 20;

  if (page && page < 1) {
    err.errors.page = "Page must be greater than or equal to 1";
    hasError = true;
  };
  if (size && size < 1) {
    err.errors.size = "Size must be greater than or equal to 1";
    hasError = true;
  };
  if (maxLat) {
    maxLat = Number(maxLat);
    if (isNaN(maxLat)) {
      err.errors.maxLat = "Maximum latitude is invalid";
      hasError = true;
    }
  };
  if (minLat) {
    minLat = Number(minLat);
    if (isNaN(minLat)) {
      err.errors.minLat = "Minumum latitude is invalid";
      hasError = true
    }
  };
  if (minLng) {
    minLng = Number(minLng);
    if (isNaN(minLng)) {
      err.errors.minLng = "Minimum longitude is invalid";
      hasError = true;
    }
  };
  if (maxLng) {
    maxLng = Number(maxLng);
    if (isNaN(maxLng)) {
      err.errors.maxLng = "Maximum longitude is invalid";
      hasError = true;
    }
  };
  if (minPrice) {
    minPrice = Number(minPrice);
    if (isNaN(minPrice) || minPrice < 0) {
      err.errors.minPrice = "Minimum price must be greater than or equal to 0";
      hasError = true;
    }
  };
  if (maxPrice) {
    maxPrice = Number(maxPrice);
    if (isNaN(maxPrice) || maxPrice < 0) {
      err.errors.maxPrice = "Maximum price must be greater than or equal to 0";
      hasError = true
    }
  };

  if (hasError === true) {
    res.status(400);
    return res.json(err)
  }

  const where = {};

  if (maxLat && minLat) {
    where.lat = {
      [Op.between]: [minLat, maxLat]
    }
  } else if (maxLat && !minLat) {
    where.lat = {
      [Op.lte]: maxLat
    }
  } else if (!maxLat && minLat) {
    where.lat = {
      [Op.gte]: minLat
    }
  };

  if (maxLng && minLng) {
    where.lng = {
      [Op.between]: [minLng, maxLng]
    }
  } else if (maxLng && !minLng) {
    where.lng = {
      [Op.lte]: maxLng
    }
  } else if (!maxLng && minLng) {
    where.lng = {
      [Op.gte]: minLng
    }
  };

  if (maxPrice && minPrice) {
    where.price = {
      [Op.between]: [minPrice, maxPrice]
    }
  } else if (maxPrice && !minPrice) {
    where.price = {
      [Op.lte]: maxPrice
    }
  } else if (!maxPrice && minPrice) {
    where.price = {
      [Op.gte]: minPrice
    }
  }

    const spots = await Spot.findAll({
      where,
      include: [
        {
          model: Review
        },
        {
          model: SpotImage
        }
      ],
      limit: size,
      offset: size * (page - 1)
    });

    const spotsInfo = [];

    spots.forEach(spot => {
      spotsInfo.push(spot.toJSON())
    })

    spotsInfo.forEach(spot => {
      let allStars = 0;
      spot.Reviews.forEach(review => {
        allStars += review.stars
      })

      spot.avgRating = allStars / spot.Reviews.length;
      delete spot.Reviews;
    });

    spotsInfo.forEach(spot => {
      spot.SpotImages.forEach(image => {
        if (image.preview === true) {
          spot.previewImage = image.url
        }
      })
      if (!spot.previewImage) {
        spot.previewImage = null
      }

      delete spot.SpotImages
    })

    return res.json({
      "Spots": spotsInfo,
      page,
      size
    })
});

// Get all Spots owned by the Current User
router.get('/current', requireAuth, async (req, res) => {
  const { user } = req;

  const spots = await Spot.findAll({
    where: {
        ownerId: user.id
    },
    include: [
      {
        model: Review
      },
      {
        model: SpotImage
      }
    ]
})

const spotInfo = []
spots.forEach(spot => {
  spotInfo.push(spot.toJSON())
})

// find avgRating
spotInfo.forEach(spot => {
    let ratings = 0
  spot.Reviews.forEach(review => {
      ratings += review.stars
  })

  spot.avgRating = ratings / spot.Reviews.length;
  if (spot.avgRating === null) {
    spot.avgRating = 0
  }
  delete spot.Reviews
})
// find previewImage if exists
spotInfo.forEach(spot => {
  spot.SpotImages.forEach(image => {
      if (image.preview === true){
          spot.previewImage = image.url
      }
  })
  if (!spot.previewImage){
      spot.previewImage = null
  }
  delete spot.SpotImages
})

res.json({ "Spots": spotInfo });
})

// Get details for a Spot from an id

router.get('/:spotId', async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId);

  if (!spot) {
    res.status(404);
    res.json({
      message: "Spot couldn't be found",
      statusCode: 404
    });
  }

  const reviewData = await spot.getReviews({
    attributes: [[Sequelize.fn("AVG", Sequelize.col("stars")), "avgStarRating"]],
  });

  const avgStarRating = reviewData[0].toJSON().avgStarRating;

  const numReviews = await Review.count({
    where: {
      spotId: spot.id
    }
  });

  const spotImages = await SpotImage.findAll({
    where: {
      spotId: spot.id
    },
    attributes: ['id', 'url', 'preview']
  });

  const owner = await User.findByPk(spot.ownerId, {
    attributes: ['id', 'firstName', 'lastName']
  });

  res.json({
    id: spot.id,
      ownerId: spot.ownerId,
      address: spot.address,
      city: spot.city,
      state: spot.state,
      country: spot.country,
      lat: spot.lat,
      lng: spot.lng,
      name: spot.name,
      description: spot.description,
      price: spot.price,
      createdAt: spot.createdAt,
      updatedAt: spot.updatedAt,
      numReviews: numReviews,
      avgStarRating: avgStarRating,
      SpotImages: spotImages,
      Owner: owner
  })
});

// Create a Spot
router.post('/', requireAuth, async (req, res) => {
  const { user } = req;
  const { address, city, state, country, lat, lng, name, description, price, createdAt, updatedAt } = req.body;

  const error = {
    message: "Validation Error",
    statusCode: 400,
    errors: {},
  };

  if (!address) error.errors.address = "Street address is required";
  if (!city) error.errors.city = "City is required";
  if (!state) error.errors.state = "State is required";
  if (!country) error.errors.country = "Country is required";
  if (!lat) error.errors.lat = "Latitude is not valid";
  if (!lng) error.errors.lng = "Longitude is not valid";
  if (name.split('').length > 49) error.errors.name = "Name must be less than 50 characters";
  if (!description) error.errors.description = "Description is required";
  if (!price) error.errors.price = "Price per day is required";

  if (!address || !city || !state || !country || !lat || !lng || (name.split('').length > 49) || !description || !price) {
    res.statusCode = 400;
    return res.json(error);
  }

  const spot = await Spot.create({
    ownerId: user.id,
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
    createdAt,
    updatedAt
  });

  res.status(201);
  res.json(spot);
});

// Add an Image to a Spot based on the Spot's id
router.post('/:spotId/images', requireAuth, async (req, res) => {
  const { user } = req;
  const { spotId } = req.params;
  const { url, preview } = req.body;

  const spots = await Spot.findByPk(spotId);

  // check if spot exists with params spotId and is the owner of the spot, authorization
  if (spots && parseInt(spots.ownerId) === parseInt(user.id)) {
    const newSpotImg = await SpotImage.create({
      spotId,
      url,
      preview
    });

    res.json({
      id: newSpotImg.id,
      url: newSpotImg.url,
      preview: newSpotImg.preview
    });
    // check if spot exists with params spotId but is not the owner of the spot, authorization
  } else if (spots && parseInt(spots.ownerId) !== parseInt(user.id)) {
    res.status(403);
    res.json({
      message: "Forbidden",
      statusCode: 403
    })

  } else {
    res.status(404);
    res.json({
      message: "Spot couldn't be found",
      statusCode: 404
    })
  }
});

// Edit a Spot by spotId
router.put('/:spotId', requireAuth, async (req, res) => {
  const { user } = req;
  const { spotId } = req.params;
  const { address, city, state, country, lat, lng, name, description, price } = req.body;

  const spots = await Spot.findByPk(spotId);

  const error = {
    message: "Validation Error",
    statusCode: 400,
    errors: {},
  };

  if (!address) error.errors.address = "Street address is required";
  if (!city) error.errors.city = "City is required";
  if (!state) error.errors.state = "State is required";
  if (!country) error.errors.country = "Country is required";
  if (!lat) error.errors.lat = "Latitude is not valid";
  if (!lng) error.errors.lng = "Longitude is not valid";
  if (name.split('').length > 49) error.errors.name = "Name must be less than 50 characters";
  if (!description) error.errors.description = "Description is required";
  if (!price) error.errors.price = "Price per day is required";

  if (!address || !city || !state || !country || !lat || !lng || name.split('').length > 49 || !description || !price) {
    res.statusCode = 400;
    return res.json(error);
  }

  if (spots && parseInt(spots.ownerId) === parseInt(user.id)) {
    await spots.update({
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price
    });

    res.json(spots);
    // check if spot exists with params spotId but is not the owner of the spot, authorization
  } else if (spots && parseInt(spots.ownerId) !== parseInt(user.id)) {
    res.status(403);
    res.json({
      message: "Forbidden",
      statusCode: 403
    })

  } else {
    res.status(404);
    res.json({
      message: "Spot couldn't be found",
      statusCode: 404
    })
  }

});

// Delete a Spot
router.delete('/:spotId', requireAuth, async (req, res) => {
  const { user } = req;
  const { spotId } = req.params;

  const spots = await Spot.findByPk(spotId);

  if (spots && parseInt(spots.ownerId) === parseInt(user.id)) {
    await spots.destroy();
    res.json({
      message: "Successfully deleted",
      statusCode: 200
    })
  } else if (spots && parseInt(spots.ownerId) !== parseInt(user.id)) {
    res.status(403);
    res.json({
      message: "Forbidden",
      statusCode: 403
    })
  } else {
    res.status(404);
    res.json({
      message: "Spot couldn't be found",
      statusCode: 404
    })
  }
})

// Get all Reviews by a Spot's id
router.get('/:spotId/reviews', async (req, res) => {
  const { spotId } = req.params

  const spots = await Spot.findByPk(spotId);

  if (spots) {
    const reviews = await Review.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName"]
        },
        {
          model: ReviewImage,
          attributes: ["id", "url"]
        }
      ],
      where: {
        spotId: spots.id
      },
      attributes: ["id", "userId", "spotId", "review", "stars", "createdAt", "updatedAt"]
    })
    res.status(200);
    res.json({ "Reviews": reviews });
  } else {
    res.status(404);
    res.json({
      message: "Spot couldn't be found",
      statusCode: 404
    })
  }
});

// Create a Review for a Spot based on the Spot's id
router.post('/:spotId/reviews', requireAuth, async (req, res) => {
  const id = req.user.id;
  const spotId = req.params.spotId;
  const { review, stars } = req.body;

  const spots = await Spot.findByPk(spotId);

  if (!spots) {
    res.status(404);
    res.json({
      message: "Spot couldn't be found",
      statusCode: 404
    })
  };

  const error = {
    message: "Validation Error",
    statusCode: 400,
    errors: {},
  };

  if (!review) error.errors.review = "Review text is required";
  if (stars < 1 || stars > 5) error.errors.stars = "Stars must be an integer from 1 to 5"

  if (!review || (stars < 1 || stars > 5)) {
    res.statusCode = 400;
    return res.json(error)
  }

  const reviewInfo = await Review.findOne({
    where: {
      userId: id,
      spotId: spotId
    }
  });

  if (reviewInfo) {
    res.status(403);
    return res.json({
      message: "User already has a review for this spot",
      statusCode: 403
    })
  };

  const newReview = await Review.create({
    userId: id,
    spotId: spots.id,
    review,
    stars
  });

  res.status(201);
  res.json(newReview);
})

// Get all Bookings for a spot based on the spot's id
router.get('/:spotId/bookings', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { user } = req;

  const spots = await Spot.findByPk(spotId);

  if (!spots) {
    res.status(404);
    return res.json({
      message: "Spot couldn't be found",
      statusCode: 404
    })
  }

  const generalBookings = await Booking.findAll({
    where: {
      spotId: spotId
    },
    attributes: ['spotId', 'startDate', 'endDate']
  })

  const ownerBookings = await Booking.findAll({
    where: {
      spotId: spotId
    },
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      }
    ]
  })

  const generalBookingList = [];

  generalBookings.forEach(booking=> {
    generalBookingList.push(booking.toJSON())
  });

  const ownerBookingList = [];

  ownerBookings.forEach(booking => {
    ownerBookingList.push(booking.toJSON())
  });

  if (spots.ownerId === user.id) {
    return res.json({"Bookings": ownerBookingList})
  } else {
    return res.json({"Bookings": generalBookingList})
  }
})


// Create a Booking from a Spot based on the Spot's id
router.post('/:spotId/bookings', requireAuth, async (req, res) => {
  const { user } = req;
  const { spotId } = req.params;
  const { startDate, endDate } = req.body;

  const spots = await Spot.findByPk(spotId);

  if (!spots) {
    res.status(404);
    res.json({
      message: "Spot couldn't be found",
      statusCode: 404
    })
  }

  if (spots && parseInt(spots.ownerId) !== parseInt(user.id)) {
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    if (newStart > newEnd) {
      res.status(400);
      return res.json({
        message: "Validation error",
        statusCode: 400,
        errors: {
          endDate: "endDate cannot be on or before startDate"
        }
      })
    }

    const alreadyBooked = await Booking.findOne({
      where: {
        [Op.or]: [
          { startDate: newStart },
          { endDate: newEnd }
        ]
      }
    })

    if (alreadyBooked) {
      res.status(403);
      return res.json({
        message: "Sorry, this spot is already booked for the specified dates",
        statusCode: 403,
        errors: {
          startDate: "Start date conflicts with an existing booking",
          endDate: "End date conflicts with an existing booking"
        }
      })
    } else {
      const validBooking = await Booking.create({
        spotId: spots.id,
        userId: user.id,
        startDate,
        endDate
      })

      return res.json(validBooking)
    }
  } else {          // if spot belongs to the current user, forbidden
    res.status(403);
    return res.json({
      message: "Forbidden",
      statusCode: 403
    })
  }
})




module.exports = router;
