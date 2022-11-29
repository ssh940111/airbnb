const express = require("express");
const router = express.Router();

const { setTokenCookie, restoreUser, requireAuth } = require("../../utils/auth");
const { User, Spot, Review, ReviewImage, SpotImage, Booking, Sequelize } = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const { Op } = require("sequelize");

// Delete a Review Image
router.delete('/:imageId', requireAuth, async (req, res) => {
    const { user } = req;
    const { imageId } = req.params;

    const reviewImages = await ReviewImage.findByPk(imageId);

    if (!reviewImages) {
        res.status(404);
        return res.json({
            message: "Review Image couldn't be found",
            statusCode: 404
        })
    }

    const reviews = await Review.findByPk(reviewImages.reviewId);

    if (reviews.userId !== user.id) {
        res.status(403);
        return res.json({
            message: "Forbidden",
            statusCode: 403,
        });
    } else {
        await reviewImages.destroy();
        res.json({
            message: "Successfully deleted",
            statusCode: 200
        })
    }
})




module.exports = router;
