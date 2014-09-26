/*
* adapt-cheat
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');
	

	Adapt.once('app:dataReady', function() {

		var buffer = "";

		$(window).on("keypress", function(e) {
			buffer+= String.fromCharCode(e.keyCode).toLowerCase();

			var blen = buffer.length;
			if (blen > 100) buffer = buffer.substr(1,100);
			blen = buffer.length

			if (buffer.substr( blen - ("kcheatfail").length, ("kcheatfail").length  ) == "kcheatfail") {

				var currentModel = Adapt.findById(Adapt.location._currentId);
				switch ( Adapt.location._contentType ) {
				case "page": case "menu":
					var componentModels = currentModel.findDescendants("components");
					var questions = componentModels.where({ _isQuestionType: true});
					_.each(questions, function(question) {
						question.set("_score",0);
						question.set("_attemptsLeft",question.set("_attempts") - 1);
						question.set("_attempts",1);
						question.set("_interactions",question.get("_interactions") ? question.get("_interactions") + 1 : 1);
					});
					componentModels.each(function(item) {
						item.set("_isCorrect", false);
						item.set("_isSubmitted", true);
						item.set("_isComplete", true);
						item.set("_isInteractionsComplete", true);
					})
					break;
				}

			} else if (buffer.substr( blen - ("kcheatpass").length, ("kcheatpass").length  ) == "kcheatpass") {

				var currentModel = Adapt.findById(Adapt.location._currentId);
				switch ( Adapt.location._contentType ) {
				case "page": case "menu":
					var componentModels = currentModel.findDescendants("components");
					var questions = componentModels.where({ _isQuestionType: true});
					_.each(questions, function(question) {
						question.set("_score",1);
						question.set("_attemptsLeft",question.set("_attempts") - 1);
						question.set("_attempts",1);
						question.set("_interactions",question.get("_interactions") ? question.get("_interactions") + 1 : 1);
					});
					componentModels.each(function(item) {
						item.set("_isCorrect", true);
						item.set("_isSubmitted", true);
						item.set("_isComplete", true);
						item.set("_isInteractionsComplete", true);
					})
					break;
				}

			} else if (buffer.substr( blen - ("kcheathalf").length, ("kcheathalf").length  ) == "kcheathalf") {

				var currentModel = Adapt.findById(Adapt.location._currentId);
				switch ( Adapt.location._contentType ) {
				case "page": case "menu":
					var componentModels = currentModel.findDescendants("components");
					var questions = componentModels.where({ _isQuestionType: true});
					var getright = questions.length / 2;
					var right = 0;
					_.each(questions, function(question) {
						if (right < getright) {
							right++
							question.set("_score",1);
							question.set("_attemptsLeft",question.set("_attempts") - 1);
							question.set("_attempts",1);
							question.set("_interactions",question.get("_interactions") ? question.get("_interactions") + 1 : 1);
						} else {
							question.set("_score",0);
							question.set("_attemptsLeft",question.set("_attempts") - 1);
							question.set("_attempts",1);
							question.set("_interactions",question.get("_interactions") ? question.get("_interactions") + 1 : 1);
						}
					});
					componentModels.each(function(item) {
						item.set("_isCorrect", item.get("_score") == 1);
						item.set("_isSubmitted", true);
						item.set("_isComplete", true);
						item.set("_isInteractionsComplete", true);
					})
					break;
				}

			}
		})


	});

})