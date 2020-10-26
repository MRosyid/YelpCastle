const Castle = require('../models/castles');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");


module.exports.index = async (req, res) => {
    const castles = await Castle.find({}).populate('popupText');
    res.render('castles/index', { castles })
}

module.exports.newForm = (req, res) => {
    res.render('castles/new');
}

module.exports.createCastle = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.castle.location,
        limit: 1
    }).send()
    const castle = new Castle(req.body.castle);
    castle.geometry = geoData.body.features[0].geometry;
    castle.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    castle.author = req.user._id;
    await castle.save();
    req.flash('success', 'Successfully made a new castle!');
    res.redirect(`/castles/${castle._id}`)
}

module.exports.showCastle = async (req, res,) => {
    const castle = await Castle.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!castle) {
        req.flash('error', 'Sorry cannot find that castle!');
        return res.redirect('/castles');
    }
    res.render('castles/show', { castle });
}

module.exports.editForm = async (req, res) => {
    const { id } = req.params;
    const castle = await Castle.findById(id)
    if (!castle) {
        req.flash('error', 'Sorry cannot find that castle!');
        return res.redirect('/castle');
    }
    res.render('castles/edit', { castle });
}

module.exports.updateCastle = async (req, res) => {
    const { id } = req.params;
    const castle = await Castle.findByIdAndUpdate(id, { ...req.body.castle });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    castle.images.push(...imgs);
    await castle.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await castle.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated the castle!');
    res.redirect(`/castles/${castle._id}`)
}

module.exports.deleteCastle = async (req, res) => {
    const { id } = req.params;
    await Castle.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted castle')
    res.redirect('/castles');
}