const express = require("express");
const router = express.Router();

const { setTokenCookie, restoreUser, requireAuth } = require("../../utils/auth");
const { User, Spot, Review, ReviewImage, SpotImage, Booking, Sequelize } = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const { Op } = require("sequelize");

// Get reviews of current user
router.get('/current', requireAuth, async (req, res) => {
    const { user } = req;
    const reviews = await Review.findAll({
        include: [
            {
                model: User,
                attributes: ["id", "firstName", "lastName"]
            },
            {
                model: Spot,
                attributes: {
                    exclude: ["createdAt", "updatedAt", "description"]
                }
            },
            {
                model: ReviewImage,
                attributes: ["id", "url"]
            }
        ],
        where: {
            userId: user.id,
        },
        attributes: ["id", "userId", "spotId", "review", "stars", "createdAt", "updatedAt"]
    });

// need to add previewImage to Spot => find from spotimage table
    for (let i = 0; i < reviews.length; i++) {
        reviews[i] = reviews[i].toJSON();

        let previewImage = await SpotImage.findOne({
            where: {
                spotId: reviews[i].spotId,
                preview: true
            }
        })
// conditional if it has a previewImage or not
        if (previewImage) {
            reviews[i].Spot.previewImage = previewImage.url;
        } else {
            reviews[i].Spot.previewImage = null;
        }
    }

    res.json({"Reviews": reviews});
})


// Add an Image to a Review based on the Review's id
router.post('/:reviewId/images', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const { url } = req.body;

    const review = await Review.findByPk(reviewId);

    if (!review) {
        res.status(404);
        res.json({
            message: "Review couldn't be found",
            statusCode: 404
        });
    }

    if (review.userId !== req.user.id) {
        res.status(403);
        res.json({
            message: "Forbidden",
            statusCode: 403
        });
    }

    const allImages = await ReviewImage.findAll({
        where: {
            reviewId: reviewId
        }
    });

    if (allImages.length >= 10) {
        res.status(403);
        res.json({
            message: "Maximum number of images for this resource was reached",
            statusCode: 403
        });
    }

    const newReviewImg = await ReviewImage.create({
        reviewId,
        url
    });

    res.status(200).json({
        id: newReviewImg.id,
        url: newReviewImg.url
    });

})

// Edit a Review
router.put('/:reviewId', requireAuth, async (req, res) => {
    const { user } = req;
    const { reviewId } = req.params;
    const { review, stars } = req.body;

    const currentReview = await Review.findByPk(reviewId);

    if (!currentReview) {
        res.status(404);
        return res.json({
            message: "Review couldn't be found",
            statusCode: 404
        })
    }

    if (currentReview.userId !== user.id) {
        res.status(403);
        return res.json({
            message: "Forbidden",
            statusCode: 403
        })
    }

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

    const updateReview = await currentReview.update({
        review,
        stars
    });

    res.status(200);
    return res.json(updateReview);
})

// Delete a Review
router.delete('/:reviewId', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const { user } = req;

    const currentReview = await Review.findByPk(reviewId);

    if (!currentReview) {
        res.status(404);
        return res.json({
            message: "Review couldn't be found",
            statusCode: 404
        })
    }

    if (currentReview.userId !== user.id) {
        res.status(403);
        return res.json({
            message: "Forbidden",
            statusCode: 403
        })
    }

    await currentReview.destroy();
    res.json({
        message: "Successfully deleted",
        statusCode: 200
    })
})


module.exports = router;
