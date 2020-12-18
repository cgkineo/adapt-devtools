define([
  'core/js/adapt',
  'core/js/router'
], function(Adapt, Router) {

  var ToggleBanking = {

    initialize: function() {
      Adapt.articles.each(function(m) {
        var config = this.getConfig(m);
        if (m.has('_assessment') && m.get('_assessment')._banks && !m.get('_assessment')._banks._isEnabled) {
          config._assessmentBankDisabled = true;
        }
      }, this);
    },

    getConfig: function(articleModel) {
      if (!articleModel.has('_devtools')) articleModel.set('_devtools', {});
      return articleModel.get('_devtools');
    },

    getBankedAssessmentsInCurrentPage: function() {
      var pageModel = Adapt.findById(Adapt.location._currentId);
      var f = function(m) {
        var config = this.getConfig(m);
        if (!config._assessmentBankDisabled &&
          m.has('_assessment') &&
          m.get('_assessment')._isEnabled &&
          m.get('_assessment')._banks._split.length > 1) return true;

        return false;
      };

      return Adapt.location._contentType === 'menu' ? [] : _.filter(pageModel.findDescendantModels('articles'), f, this);
    },

    toggle: function() {
      var bankedAssessments = this.getBankedAssessmentsInCurrentPage();
      var isBankingEnabled = function(m) { return m.get('_assessment')._banks._isEnabled; };
      var enable = !_.some(bankedAssessments, isBankingEnabled);

      _.each(bankedAssessments, function(articleModel) {
        articleModel.get('_assessment')._banks._isEnabled = enable;
        // set properties to trigger setup of assessment data
        articleModel.set({
          _attemptInProgress: false,
          _isPass: false
        });
      });

      // reload page
      Router.handleId(Adapt.location._currentId);
    }
  };

  Adapt.once('adapt:initialize devtools:enable', function() {
    if (!Adapt.devtools.get('_isEnabled')) return;

    ToggleBanking.initialize();
  });

  return ToggleBanking;

});
