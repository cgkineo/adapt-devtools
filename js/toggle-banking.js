import Adapt from 'core/js/adapt';
import Router from 'core/js/router';
import data from 'core/js/data';
import location from 'core/js/location';

class ToggleBanking extends Backbone.Controller {

  initialize() {
    this.listenToOnce(Adapt, 'adapt:initialize devtools:enable', this.isEnabled);
  }

  isEnabled () {
    if (!Adapt.devtools.get('_isEnabled')) return;
    Adapt.articles.each(m => {
      const config = this.getConfig(m);
      const hasAssessmentBanks = m.has('_assessment') && m.get('_assessment')._banks && !m.get('_assessment')._banks._isEnabled;
      if (hasAssessmentBanks) return;
      config._assessmentBankDisabled = true;
    });
  }

  getConfig(articleModel) {
    if (!articleModel.has('_devtools')) articleModel.set('_devtools', {});
    return articleModel.get('_devtools');
  }

  getBankedAssessmentsInCurrentPage() {
    const pageModel = data.findById(location._currentId);
    const f = m => {
      const config = this.getConfig(m);
      if (!config._assessmentBankDisabled &&
        m.has('_assessment') &&
        m.get('_assessment')._isEnabled &&
        m.get('_assessment')._banks._split.length > 1) return true;
      return false;
    };
    return location._contentType === 'menu' ? [] : pageModel.findDescendantModels('articles').filter(f);
  }

  toggle() {
    const bankedAssessments = this.getBankedAssessmentsInCurrentPage();
    const isBankingEnabled = m => m.get('_assessment')._banks._isEnabled;
    const enable = !bankedAssessments.some(isBankingEnabled);
    bankedAssessments.forEach(articleModel => {
      articleModel.get('_assessment')._banks._isEnabled = enable;
      // set properties to trigger setup of assessment data
      articleModel.set({
        _attemptInProgress: false,
        _isPass: false
      });
    });
    // reload page
    Router.handleId(location._currentId);
  }
}

export default new ToggleBanking();
