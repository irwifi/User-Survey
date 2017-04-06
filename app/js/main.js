"use strict";
// Survey Module
const survey_module = (() => {
	let submitted_option = [];

	// Send XMLHttpRequest
	// Params: api_url - String, submit_data - JSON, callback - Function, callback_var - String
	const send_xmlhttprequest = (params) => {
		let request = new XMLHttpRequest();
		if(params.submit_data === undefined) {
			request.open('GET', params.api_url);
		} else {
			request.open('POST', params.api_url);
			request.setRequestHeader('Content-Type', 'application/json');
			params.submit_data = JSON.stringify(params.submit_data);
		}

		request.onreadystatechange = function () {
			if (this.readyState === 4) {
				const parsed_obj = JSON.parse(this.responseText);
				params.callback({[params.callback_var]: parsed_obj});
			}
		};

		request.send(params.submit_data);
	}

	// Gets all the survey from the API in JSON format
	// Params: api_url - String
	const get_all_surveys = (params) => {
		params.callback = display_survey_list;
		params.callback_var = "survey_obj";
		send_xmlhttprequest(params)
	}

	// Displays the list of surveys on the page
	// Params: survey_obj - Object
	const display_survey_list = (params) => {
		const survey_obj = params.survey_obj.surveys;
		let survey_list = "";
		for(let item in survey_obj) {
			let survey_item = survey_obj[item]
			survey_list += "<div class='well well-lg' data-id='" + survey_item.id + "'>" + survey_item.title + ": " + survey_item.tagline +"</div>";
		}
		$(".survey_list").html(survey_list);
		$(".survey_list .well").off("click"); // Remove previously attached event listener
		$(".survey_list .well").on("click", function() {load_survey_detail({"id": $(this).data("id"), "title": $(this).text()});})
	}

	// Loads the survey detail page
	// Params: id - String, title - String
	const load_survey_detail = (params) => {
		$(".survey_questions .navbar-header").text(params.title);

		const params_out = {"api_url": api_url+"/"+params.id , "callback": load_questions, "callback_var": "question_obj"};
		send_xmlhttprequest(params_out)

		$(".survey_questions .go_back").off("click"); // Remove previously attached event listener
		$(".survey_questions .go_back").on("click", () => {
			$(".survey_questions").hide();
			$(".survey_page").show();
			get_all_surveys({api_url});
		});
	}

	// Loads the survey questions
	// Params: question_obj - Object
	const load_questions = (params) => {
		const question_obj = params.question_obj.survey.questions;
		let question_list = "";
		for(let item in question_obj) {
			let question_item = question_obj[item];
			question_list += "<div class='questions' data-id='" + question_item.id + "'>\
									<div class='title'>" + question_item.title + ": " +"</div>\
									<ul class='list-group option_list'>";

			let option_list = "";
			let counter = 0;
			for(let option in question_item.options) {
				counter++;
				let question_option = question_item.options[option];
				option_list += "<li class='option list-group-item' data-counter='" + counter + "'>" + question_option +"</li>";
			}

			question_list += option_list + "</ul></div>";
		}

		$(".survey_page").hide();
		$(".survey_questions").show();
		$(".survey_items").html(question_list);
		$(".survey_items .questions:first").show();

		$(".questions .option").off("click"); // Remove previously attached event listener
		$(".questions .option").on("click", function() {select_option({"survey_id": params.question_obj.survey.id,"id": $(this).closest(".questions").data("id"), "counter": $(this).data("counter")});})
	}

	// Select Option
	// Params: survey_id - String, id - String, counter - String
	const select_option = (params) => {
		// Remove the current active selection
		$(".questions[data-id = '" + params.id + "'] .option.active").removeClass("active");

		// Make new selection
		$(".questions[data-id = '" + params.id + "'] .option[data-counter = '" + params.counter + "']").addClass("active");

		$(".survey_nav").show();
		if($(".survey_nav .submit").is(":visible")) {
			$(".survey_nav .submit").off("click"); // Remove previously attached event listener
			$(".survey_nav .submit").on("click", function() {submit_survey({"survey_id": params.survey_id, "id": params.id});})
		} else {
			// Removing previously attached event listener
			$(".survey_nav .next").off('click');
			// Attaching new event listener
			$(".survey_nav .next").on("click", function() {load_next_question({"id": params.id});})
		}
	}

	// Load Next Question
	// Params: id - String
	const load_next_question = (params) => {
		$(".survey_nav").hide();
		$(".questions[data-id='" + params.id + "']").hide();
		$(".questions[data-id='" + params.id + "'] + .questions").show();
		push_selected_option({"id": params.id});
		if($(".questions[data-id='" + params.id + "'] + .questions + .questions").length === 0) {
			$(".survey_nav .next").hide();
			$(".survey_nav .submit").show();
		}
	}

	// Push the selection to the array
	// Params: id - String
	const push_selected_option = (params) => {
		submitted_option.push({
						            'question_id': params.id,
						            'value': $(".questions[data-id='" + params.id + "'] .option.active").text()
							    });
	}

	// Submit the survey
	// Params: survey_id - String, id - String
	const submit_survey = (params) => {
		$(".survey_questions").hide();
		push_selected_option({"id": params.id});
		let submit_body = {'completion': submitted_option};

		const params_out = {"api_url": api_url+"/"+params.id+"/completions" ,"submit_data": submit_body, "callback": survey_complete, "callback_var": "complete_msg"};
		send_xmlhttprequest(params_out)
	}

	// Survey Complete
	// Params: complete_msg - Object
	const survey_complete = (params) => {
		if(params.complete_msg.action !== "completion") {
			$(".survey_complete .panel-body").text("Some error was encountered.")
		}
		$(".survey_complete").show();
		$(".survey_complete .go_back").off("click"); // Remove previously attached event listener
		$(".survey_complete .go_back").on("click", function() {
			$(".survey_complete").hide();
			$(".survey_page").show();
			get_all_surveys({api_url});
		});

		$(".survey_nav .next").show();
		$(".survey_nav .submit").hide();
	}

	// Return the functions to make them available publicly
	return {
		get_all_surveys
	}
})()

const api_url = 'https://private-anon-7e8f19b11e-surveys7.apiary-mock.com/api/surveys';
$(() => {
	survey_module.get_all_surveys({api_url});
});
