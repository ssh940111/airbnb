const express = require("express");
const router = express.Router();

const { setTokenCookie, restoreUser, requireAuth } = require("../../utils/auth");
const { User, Spot, Review, ReviewImage, SpotImage, Booking, Sequelize } = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const { Op } = require("sequelize");

// Get all of the current user's bookings
router.get('/current', requireAuth, async (req, res) => {
    const { user } = req;

    const allBookings = await Booking.findAll({
        include: [
            {
                model: Spot,
                attributes: {
                    exclude: ['createdAt', 'updatedAt', 'description']
                },
                include: [
                    {
                        model: SpotImage
                    }
                ]
            }
        ],
        where: {
            userId: user.id
        }
    })

    const bookingList = [];

    allBookings.forEach(booking => {
        bookingList.push(booking.toJSON())
    });

    bookingList.forEach(booking => {
        booking.Spot.SpotImages.forEach(image => {
            if (image.preview === true) {
                booking.Spot.previewImage = image.url;
            }
        })
        delete booking.Spot.SpotImages
    });

    res.json({ "Bookings": bookingList})
});

// edit a booking
router.put('/:bookingId', requireAuth, async (req, res) => {
    const { user } = req;
    const { bookingId } = req.params;
    const { startDate, endDate } = req.body;

    const newEnd = new Date(endDate);
    const newStart = new Date(startDate);

    if (newEnd <= newStart) {
      return res.status(400).json({
        message: "Validation error",
        statusCode: 400,
        errors: {
          endDate: "endDate cannot come before startDate",
        },
      });
    }

    const bookings = await Booking.findByPk(bookingId);

    if (!bookings) {
        res.status(404);
        return res.json({
            message: "Booking couldn't be found",
            statusCode: 404,
        });
    }

    if (bookings.userId !== user.id) {
        res.status(403);
        return res.json({
            message: "Forbidden",
            statusCode: 403,
        });
    }

    if (newEnd <= new Date()) {
        res.status(403)
        return res.json({
            message: "Past bookings can't be modified",
            statusCode: 403,
        });
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
    }

    const updateBooking = await bookings.update({
      startDate,
      endDate,
    });

    return res.json(updateBooking);
})

// Delete a Booking
router.delete('/:bookingId', requireAuth, async (req, res) => {
    const { user } = req;
    const { bookingId } = req.params;

    const bookings = await Booking.findByPk(bookingId);

    if (!bookings) {
        res.status(404);
        return res.json({
            message: "Booking couldn't be found",
            statusCode: 404,
        });
    }

    if (bookings.userId !== user.id) {
        res.status(403);
        return res.json({
            message: "Forbidden",
            statusCode: 403,
        });
    }

    if (bookings.startDate <= new Date()) {
        res.status(403);
        return res.json({
            message: "Bookings that have been started can't be deleted",
            statusCode: 403
        });
    }

    await bookings.destroy();
    return res.json({
        message: "Successfully deleted",
        statusCode: 200
    })

})



module.exports = router;
