const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const {
  getAllTours,
  getTourById,
  createNewTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = tourController;

const { protect, restrictTo } = authController;

const router = express.Router();

// router.param('id', checkId);

router.route('/').get(protect, getAllTours).post(createNewTour);
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);
router
  .route('/:id')
  .get(getTourById)
  .patch(updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
