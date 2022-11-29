const express = require("express");
const router = express.Router();

const { setTokenCookie, restoreUser, requireAuth } = require("../../utils/auth");
const { User, Spot, Review, ReviewImage, SpotImage, Booking, Sequelize } = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const { Op } = require("sequelize");

// Delete a Spot Image
router.delete('/:imageId', requireAuth, async (req, res) => {
    const { user } = req;
    const { imageId } = req.params;

    const spotImages = await SpotImage.findByPk(imageId);

    if (!spotImages) {
        res.status(404);
        return res.json({
            message: "Spot Image couldn't be found",
            statusCode: 404
        })
    }

    const spots = await Spot.findByPk(spotImages.spotId);

    if (spots.ownerId !== user.id) {
        res.status(403);
        return res.json({
            message: "Forbidden",
            statusCode: 403,
        });
    } else {
        await spotImages.destroy();
        res.json({
            message: "Successfully deleted",
            statusCode: 200
        })
    }
})







module.exports = router;
