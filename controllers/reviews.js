const Castle = require('../models/castles');
const Review = require('../models/reviews');

module.exports.createReview = async (req, res) => {
    const castle = await Castle.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    castle.reviews.push(review);
    await review.save();
    await castle.save();
    req.flash('success', 'Successfully created a new review!');
    res.redirect(`/castles/${castle._id}`);
}

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Castle.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted the review!')
    res.redirect(`/castles/${id}`);
}