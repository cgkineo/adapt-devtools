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

			if (buffer.substr( blen - ("kcheat").length, ("kcheat").length  ) == "kcheat") {

				var currentModel = Adapt.findById(Adapt.location._currentId);
				switch ( Adapt.location._contentType ) {
				case "page": case "menu":
					var componentModels = currentModel.findDescendants("components");
					var questions = componentModels.where({ _isQuestionType: true});
					_.each(questions, function(question) {
						question.set("_score",1);
					});
					componentModels.each(function(item) {
						item.set("_isComplete", true);
						item.set("_isInteractionsComplete", true);
					})
					break;
				}

			}
		})


	});

})