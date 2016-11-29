var course_colour = '#CCFF9A';
var conflict_colour = '#FABD4E';

var university_identification = null;
			
var site_location = "http://www.timetablegenerator.com";
			
// Settings for the particular school.
var settings_parcel = null;

var DataLoader = {

	universities : null,
	
	timingMap : null,
	
	reloadData : null,
	
	buildTimingMap : function(){
	
		DataLoader.breadthTimingMap = new Array();
		DataLoader.depthTimingMap = new Array();
		
		DataLoader.timingMap = new Array();
		
		var days = ['mo', 'tu', 'we', 'th', 'fr', 'sa'];
		
		for(var term = 1; term < 3; term++){
			
			DataLoader 
			for(var x = 0; x < days.length; x++){
				
				var last_hour = 0;
				var last_minute = 0;
				
				var hour = 8;
				var minute = 0;
				
				// Build depth map.
				while( (hour == 22 && minute == 0) ||  (hour < 22)){
	
					var time_slot = "term" + term.toString() + "_" + days[x] + "_" + hour.toString() + minute.toString();
					
					DataLoader.timingMap.push(time_slot);
					
					if(minute == 30){
						minute = 0;
						hour++;
					}
					else
						minute = 30;
				}
			}
		}
	},
	
	retrieveUniversities : function() {
		
		$.ajax({
			type: "GET",
			url: site_location + "/data/universities.json",
			dataType: "json",
			success: function(response){
			
				$("#courses_div").html("");
				$("#course_add_button").html("<b>Click to load university data</b>");
				$("#course_add_button").attr("onclick", "DataLoader.setUniversity();");
				$("#course_add_button").attr("disabled", false);
				
				DataLoader.universities = response;
				
				TimetableManipulator.renderSchedule();
				
				var selector = $('<select></select>').attr("id", "university_selector");
				
				selector.append($('<option></option>').html('Select a university...').attr({'selected' : 'selected', 'value' : 'bad'}));
				
				var depNames = new Array();
				
				// Sort the universities.
				for(var x in response)
					depNames.push(x);
				
				depNames.sort();
				
				for(var x = 0; x < depNames.length; x++)
					selector.append($('<option></option>').html(response[depNames[x]].name).attr('value', depNames[x]));
					
				$("#courses_div").append(selector);
				
				DataLoader.injectStateData();
			},
		});
	},
	
	createStateLink : function() {
	
		$("#state_create_button").attr("disabled", true);
		$("#state_create_button").html("Hold on...");
		
		var i = 0;

		var selectors = new Array();
		var display_type = $("input[name=course_colour_group]:checked").val();

		for(var x = 0; x < BoxManager.activeSelectors.length; x++){
			
			var i = BoxManager.activeSelectors[x];
			
			if($("#advance_button_" + i).attr("disabled") == "disabled"){
			
				var selection_array = new Array();
				
				selection_array.push($("#dep_select_" + i + " option:selected").attr("value"));
				selection_array.push($("#course_select_" + i + " option:selected").attr("value"));
				selection_array.push($("#core_select_" + i + " option:selected").attr("value"));
				selection_array.push($("#tutorial_select_" + i + " option:selected").attr("value"));
				selection_array.push($("#lab_select_" + i + " option:selected").attr("value"));
				
				selectors.push(selection_array);
			}
			
			i++;
		}

		var data = btoa(JSON.stringify({"selectors" : selectors, "type" : display_type, "school" : university_identification.prefix}));
		
		$.ajax({
			type: "POST",
			url: "http://www.timetablegenerator.com/tinyproxy.php",
			dataType: "text",
			data : { "data" : data},
			success: function(response){
				
				var stateLink = "http://www.timetablegenerator.com/#" + response.replace("http://tinyurl.com/", "");
				
				$("#timetable_link").html($("<a></a>").html("Click for new link").attr("href", stateLink));

				$("#state_create_button").html("Create Link");
				$("#state_create_button").attr("disabled", false);
				
			},
		});
	},
	
	injectStateData :  function() {
	
		// Keeping for legacy purposes.
		var data = DataLoader.getQueryParameters()['data'];
		
		if(typeof data == 'undefined'){
			
			// If the legacy key has not been located, try the new version.
			data = window.location.href.replace("http://www.timetablegenerator.com", "").replace("/", "");
			
			if(/^#[a-zA-Z0-9]{3,10}/.exec(data) != null){
			
				$.ajax({
					type: "GET",
					url: "http://www.timetablegenerator.com/antitinyproxy.php?key=" + data.substr(1),
					dataType: "text",
					success: function(response){
						
						BoxManager.reconstructStage1( eval('(' + atob(response) + ')'));
					},
				});
			}
		}
		else {
			
			data = eval('(' + atob(data) + ')');
			
			BoxManager.reconstructStage1(data);
		}
	},
	
	getQueryParameters : function() {

		var vars = {};
		var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, 
			function(m,key,value) {
				vars[key] = value;
			});
		return vars;
	},
	
	setUniversity : function() {
	
		var selectedOption = null;
		
		if(DataLoader.reloadData == null) 
			selectedOption = $("#university_selector option:selected").attr('value');
		else
			selectedOption = DataLoader.reloadData.school;
		
		if(selectedOption == "bad"){
		
			alert("Select a university before proceeding...");
			return;
		}
		
		var selectedUniversitySettings = DataLoader.universities[selectedOption];
			
		university_identification = { 
										name : selectedUniversitySettings.name,
										prefix : selectedOption
									};
		
		settings_parcel = selectedUniversitySettings.visual_settings;
		
		$("#courses_div").html("Hold on, retrieving scheduling for " + selectedUniversitySettings.name + "...");
		
		$("#course_add_button").html("<b>Add another course</b>");
		$("#course_add_button").attr("onclick", "BoxManager.addNewSelector(TimetableManipulator.masterList)");
		$("#course_add_button").attr("disabled", true);
				
		$.ajax({
			type: "GET",
			url: site_location + "/sched.php?data=" + university_identification.prefix + "&size=" + (($(window).width() > 1403)? "1" : "0"),
			dataType: "json",
			success: function(response){
			
				$("#course_add_button").attr("disabled", false);
				$("#courses_div").html("<b>University</b> : " + university_identification.name 
						+ "&nbsp;<a href='" + site_location + "/listings/" + university_identification.prefix 
						+ ".html' target='_blank'>(Click here for detailed listings)</a></br>");
				
				TimetableManipulator.masterCourseList = response.courses;
				TimetableManipulator.masterDepartmentList = response.departments;
				
				if(DataLoader.reloadData != null)
					BoxManager.reconstructStage2(DataLoader.reloadData);
				else
					BoxManager.addNewSelector(TimetableManipulator.masterList);
				
				$("#save_state_div").css("display", "block");
			}
		});
	}
}
			
var TimetableManipulator = {

	runningSchedule : {},
	masterCourseList : null,
	masterDepartmentList : null,
	
	sameCourse : function(schoolUnitA, schoolUnitB){
	
		if(schoolUnitA['tod'] != schoolUnitB['tod'])
			return false;
			
		if(schoolUnitA['t'] != schoolUnitB['t'])
			if(typeof schoolUnitA['termThree'] == 'undefined' || 
				typeof schoolUnitB['termThree'] == 'undefined')
				return false;
			
		if(schoolUnitA['n'] != schoolUnitB['n'])
			return false;
			
		if(schoolUnitA['cod'] != schoolUnitB['cod'])
			return false;
			
		if(schoolUnitA['dep'] != schoolUnitB['dep'])
			return false;
			
		return true;
	},
	
	schoolUnitsEqual : function(schoolUnitA, schoolUnitB){
		
		if(schoolUnitA['targetType'] != schoolUnitB['targetType'])
			return false;
			
		return TimetableManipulator.sameCourse(schoolUnitA, schoolUnitB);
	},
	
	splitTargets : function(schoolUnit){
	
		var firstTerm = jQuery.extend(true, {}, schoolUnit);
		var secondTerm = jQuery.extend(true, {}, schoolUnit);
		
		firstTerm['target']['ti'] = new Array();
		secondTerm['target']['ti'] = new Array();
		
		firstTerm['t'] = 1;
		secondTerm['t'] = 2;
		
		firstTerm.termThree = true;
		secondTerm.termThree = true;
		
		var times = schoolUnit['target']['ti'];
		
		for(var x = 0; x < times.length; x++){
		
			if(times[x][0] == 1 || times[x][0] == 3)
				firstTerm['target']['ti'].push(times[x]);
				
			if(times[x][0] == 2 || times[x][0] == 3)
				secondTerm['target']['ti'].push(times[x]);
		}
		
		return {"first" : firstTerm, "second" : secondTerm};
	},
	
	importSchoolUnit : function(schoolUnit){
		
		if(schoolUnit['t'] == 3){

			var targets = TimetableManipulator.splitTargets(schoolUnit);
			
			TimetableManipulator.importSchoolUnit(targets.first);
			TimetableManipulator.importSchoolUnit(targets.second);
			
			return;
		}
		
		var term_prefix = "term" + schoolUnit['t'].toString();
		
		var times = schoolUnit['target']['ti'];
			
		for(var x = 0; x < times.length; x++){
			
			// The time-space for this course exists as an array.
			var day_prefix = times[x][1];
			var hour = times[x][2];
			var minute = times[x][3];
			var finalHour = times[x][4];
			var finalMinute = times[x][5];
			
			// Artificially insert the location as a 'loc' key into the target for
			// readibility in complicated code.
			schoolUnit['target']['loc'] = times[x][6];
			
			// Round the starting time to the slot it begins existing in.
			if(minute != 30 && minute != 0){
				
				if(minute > 30){
					if(minute - 30 > 15){
					
						minute = 0;
						hour++;
					}
					else
						minute = 30;
				}
				else {
				
					if(30 - minute > 15)
						minute = 0;
					else 
						minute = 30;
				}
			}
			
			while( (hour == finalHour && minute < finalMinute) || (hour < finalHour) ){
			
				var timeID = term_prefix + "_" + day_prefix + "_" + hour.toString() + minute.toString();
				
				var timeSlot = TimetableManipulator.runningSchedule[timeID];
				
				if(typeof timeSlot == 'undefined')
					TimetableManipulator.runningSchedule[timeID] = [schoolUnit];
				else
					TimetableManipulator.runningSchedule[timeID].push(schoolUnit);
					
				if(minute == 30){
					minute = 0;
					hour++;
				}
				else
					minute = 30;
			}
		}	
	},
	
	removeSchoolUnit: function(schoolUnit){
	
		var times = schoolUnit['target']['ti'];
		
		// Remove and free up any used colours.
		for(var colour in TimetableManipulator.colourWheel){
			if(TimetableManipulator.colourWheel[colour] != null){
				if(TimetableManipulator.sameCourse(TimetableManipulator.colourWheel[colour], schoolUnit)){
					TimetableManipulator.colourWheel[colour] = null;
					break;
				}
			}
		}
			
		if(schoolUnit['t'] == 3){

			var targets = TimetableManipulator.splitTargets(schoolUnit);
			
			TimetableManipulator.removeSchoolUnit(targets['first']);
			TimetableManipulator.removeSchoolUnit(targets['second']);
			
			return;
		}
		
		var term_prefix = "term" + schoolUnit['t'].toString();
			
		for(var x = 0; x < times.length; x++){
			
			// 
			var day_prefix = times[x][1];
			var hour = times[x][2];
			var minute = times[x][3];
			var finalHour = times[x][4];
			var finalMinute = times[x][5];
			
			while( (hour == finalHour && minute < finalMinute) || (hour < finalHour) ){
			
				var timeID = term_prefix + "_" + day_prefix + "_" + hour.toString() + minute.toString();
				var timeSlot = TimetableManipulator.runningSchedule[timeID];
				
				if(typeof timeSlot != 'undefined'){
				
					var toRemove = null;
					
					for(var y in timeSlot)
						if(TimetableManipulator.schoolUnitsEqual(timeSlot[y], schoolUnit)){
							toRemove = y;
							break;
						}
					
					TimetableManipulator.runningSchedule[timeID].splice(y, 1);
					
					// Remove the time-space from the running schedule if it is now empty.
					if(TimetableManipulator.runningSchedule[timeID].length == 0)
						delete TimetableManipulator.runningSchedule[timeID];
				}
				
				if(minute == 30){
					minute = 0;
					hour++;
				}
				else
					minute = 30;
			}
		}
	},
	
	// The colours must be predefined rather than random for aesthetic purposes.
	colourWheel : {
					'#DCF394' : null,
					'#CCECF4' : null,
					'#FFD7E3' : null,
					'#F8FAA0' : null,
					'#FAC892' : null,
					'#A8A4FB' : null,
					'#BBFDD7' : null,
					'#A8D3A0' : null,
					'#36FED1' : null,
					'#68FE36' : null,
					'#F7806F' : null,
					'#E4C7FC' : null,
					'#DAF7CC' : null,
					'#8BF986' : null,
					'#DFE19D' : null
				},
	
	getColour : function(schoolUnit){
	
		var firstFreeColour = null;
		var setColour = null;
		
		// Establish a new colour or retrieve an exising colour for the course.
		for(var colour in TimetableManipulator.colourWheel){
		
			if(TimetableManipulator.colourWheel[colour] != null){
				
				if(TimetableManipulator.sameCourse(TimetableManipulator.colourWheel[colour], schoolUnit)){
					setColour = colour;
					break;
				}
			}
			else 
				if(firstFreeColour == null)
					firstFreeColour = colour;
		}
		
		if(setColour == null){
		
			// If we have run out of colours, just use the default colour.
			if(firstFreeColour == null)
				setColour = course_colour;
			else{
			
				TimetableManipulator.colourWheel[firstFreeColour] = schoolUnit;
				setColour = firstFreeColour;
			}
		}
		
		// If the user has selected that they desire monochrome.
		if($("input[name=course_colour_group]:checked").val() == 'mono')
			setColour = course_colour;
			
		return setColour;
	},
	
	clearSchedule : function(){

		var days = ['mo', 'tu', 'we', 'th', 'fr', 'sa'];
		
		// Remove Saturday column headers if they exist.
		if($("#term1_sa_header").length > 0){
			$("#term1_sa_header").remove();
			$("#term1_details").attr("colspan", 6);
			$("#term1_title").attr("colspan", 6);
		}
			
		if($("#term2_sa_header").length > 0){
			$("#term2_sa_header").remove();
			$("#term2_details").attr("colspan", 6);
			$("#term2_title").attr("colspan", 6);
		}
		
		for(var x = 0; x < DataLoader.timingMap.length; x++){
			
			var time_slot = DataLoader.timingMap[x];
			
			var day = /^term[123]_([a-z]{2,2})_[0-9]+$/.exec(time_slot)[1];
			
			if($("#" + time_slot).length > 0)
				$("#" + time_slot).remove();
			
			if(day != 'sa'){

				var newTime = $('<td></td>').attr({'id' : time_slot, 'class': 'daytime_slot'});
				
				$("#" + time_slot.replace("_" + day + "_", "_")).append(newTime);
			}
		}
	},
	
	buildSaturday : function(term){
		
		$("#term" + term.toString() + "_title").attr("colspan", 7);
		$("#term" + term.toString() + "_details").attr("colspan", 7);
		
		var newDayHeader = $('<th>Saturday</th>').attr({'id' : "term" + term.toString() + "_sa_header" , 'class': 'days'});
		$("#term" + term.toString() + "_days").append(newDayHeader);
		
		var pattern = new RegExp("^term" + term + "_sa_");
		
		for(var x = 0; x < DataLoader.timingMap.length; x++){
			
			var time_slot = DataLoader.timingMap[x];
			
			if(pattern.exec(time_slot) != null){
				
				var newTime = $('<td></td>').attr({'id' : time_slot, 'class': 'daytime_slot'});
				
				$("#" + time_slot.replace("_sa_", "_")).append(newTime);
			}
		}
	},
	
	renderSchedule : function(){
		
		var days = ['mo', 'tu', 'we', 'th', 'fr', 'sa'];
		
		var term_hours = [0,0];
		var term_units = [0,0];
		
		var saturday_built = [false, false];
		
		var last_conflict_array = null;	// The last array of conflicting school units.
		var conflict_element = null;	// The last element where a conflict has been rendered.
		var master_element = null;		// The element where a new course (or alternating courses) started.
		var master_school_unit = null;	// The latest course to be rendered in the timetable.
		
		var visited = new Array();
		
		// Clear existing data from the schedule.
		TimetableManipulator.clearSchedule();
		
		for(var x = 0; x < DataLoader.timingMap.length; x++){
			
			var time_slot= DataLoader.timingMap[x];
			
			var course_set = TimetableManipulator.runningSchedule[time_slot];
			
			if(course_set == null || course_set.length == 0){
			
				last_conflict_array = null;
				conflict_element = null;
				master_element = null;
				master_school_unit = null;
				
				continue;
			}
			
			var term_data = /^term([12])_([a-z]+)_/.exec(time_slot);
			
			var term = parseInt(term_data[1]);
			var day = term_data[2];
			
			term_hours[term - 1] += 0.5;

			// Check to see if any Saturday columns are necessary and build them if so.
			if(day == 'sa'){
				
				if(!saturday_built[0] && term == 1){
					TimetableManipulator.buildSaturday(1);
					saturday_built[0] = true;
				}
				else if(!saturday_built[1] && term == 2){
					TimetableManipulator.buildSaturday(2);
					saturday_built[1] = true;
				}
			}
			
			// Check if the current course is new. If so, add it's units.
			for(var y = 0; y < course_set.length; y++){
			
				var newData = true;
				
				for(var w = 0; w < visited.length; w++){
					if(TimetableManipulator.sameCourse(course_set[y], visited[w])){
						newData = false;
						break;
					}
				}
				
				if(newData){
					visited.push(course_set[y]);
					var units = course_set[y]['u'];
					
					if(typeof course_set[y].termThree != 'undefined'){
						term_units[0] += units/2;
						term_units[1] += units/2;
					}
					else	
						term_units[term - 1] += units;
				}
			}
			
			// If one school unit is currently occupying the time slot.
			if(course_set.length == 1){
				
				conflict_element = null;
				last_conflict_array = null;
				
				if(master_element == null || !TimetableManipulator.schoolUnitsEqual(course_set[0], master_school_unit)){
				
					master_element = $("#" + time_slot);
					master_school_unit = course_set[0];
					
					var setColour = TimetableManipulator.getColour(master_school_unit);
					
					master_element.attr({"bgcolor" : setColour, "rowspan" : 1});
					master_element.css("background", setColour);
					
					var supervisor = "<font color='blue'>";
					
					if(master_school_unit['targetType'] == "c"){
						if(master_school_unit['target']['sups'].length > 0)
							supervisor +=  "</br>" + master_school_unit['target']['sups'][0];
					}
					
					supervisor += "</font>";
					
					master_element.html( ((settings_parcel.uses_depheaders)? master_school_unit['dep'] + " " : "")
										+ master_school_unit['cod'] + " " + settings_parcel.school_unit_prefixes[master_school_unit['targetType']]
										+ master_school_unit['target']['n']
										+ supervisor
										+ ((settings_parcel.uses_serials)? "</br>" + master_school_unit['target']['sn'] : "")
										+ ((typeof master_school_unit['target']['loc'] != 'undefined')? ("</br>" + master_school_unit['target']['loc']) : "")
										+ ((master_school_unit['target']['EOW'])? 
											"</br><font color='red'>" + settings_parcel.eow_word + "</font>" : ""));
					
				}
				else {
					master_element.attr("rowspan", parseInt(master_element.attr("rowspan")) + 1);
					$("#" + time_slot).remove();
				}
			}
			// If more than one school unit is currently occupying the time slot.
			else {
				
				master_element = null;
				master_school_unit = null;
				
				var same_conflict = true;
				
				if(last_conflict_array != null){
					if(course_set.length == last_conflict_array.length){
					
						for(var y = 0; y < course_set.length; y++){
						
							var found = false;
						
							for(var z = 0; z < last_conflict_array.length; z++)
								if(TimetableManipulator.schoolUnitsEqual(course_set[y], last_conflict_array[z])){
									found = true;
									break;
								}
							
							if(!found){
								same_conflict = false;
								break;
							}
						}
					}
					else
						same_conflict = false;
				}
				else
					same_conflict = false;
					
				if(same_conflict){
					
					conflict_element.attr("rowspan", parseInt(conflict_element.attr("rowspan")) + 1);
					$("#" + time_slot).remove();
				}
				else {
				
					conflict_element = $("#" + time_slot);
					last_conflict_array = course_set;
					
					var true_conflict = false;
					
					// Check if it's actually a conflict, or just two EOW conflicts.
					for(var n = 0; n < course_set.length; n++){
						for(var m = 0; m < course_set.length; m++){
							if(m != n){
								if(!course_set[n]['target'].EOW 
									|| !course_set[m]['target'].EOW 
									|| !TimetableManipulator.sameCourse(course_set[m], course_set[n])
									|| course_set[m]['targetType'] == course_set[n]['targetType']
								){
									true_conflict = true;
									break;
								}
							}
							
							if(true_conflict)
								break;
						}
					}
					
					if(true_conflict){
						$("#" + time_slot).attr("bgcolor", conflict_colour);
						$("#" + time_slot).css("background", conflict_colour);
					}
					else {
					
						var setColour = TimetableManipulator.getColour(course_set[0]);
						
						$("#" + time_slot).attr("bgcolor", setColour);
						$("#" + time_slot).css("background", setColour);
					}
						
					$("#" + time_slot).attr("rowspan", 1);
					
					conflict_element.html("");
					
					for(var n = 0; n < course_set.length; n++){
					
						var unit = course_set[n];
						
						var supervisor = "<font color='blue'>";
						
						if(unit['targetType'] == "c"){
							if(unit['target']['sups'].length > 0)
								supervisor +=  "</br>" + unit['target']['sups'][0];
						}
						
						supervisor += "</font>";
							
						conflict_element.append(((settings_parcel.uses_depheaders)? unit['dep'] + " " : "")
											+ unit['cod'] + " " + settings_parcel.school_unit_prefixes[unit['targetType']]
											+ unit['target']['n'] 
											+ supervisor
											+ ((settings_parcel.uses_serials)? "</br>" + unit['target']['sn'] : "")
											+ ((typeof unit['target']['loc'] != 'undefined')? ("</br>" + unit['target']['loc']) : "")
											+ "</br><font color='red'>" + ((true_conflict)? "*** CONFLICT ***" : settings_parcel.eow_word)
											+ "</br>");
					}
				}
			}
		}
		
		$("#term1_details").html("TOTAL HOURS : " + term_hours[0] + ", TOTAL UNITS : " + term_units[0]);
		$("#term2_details").html("TOTAL HOURS : " + term_hours[1] + ", TOTAL UNITS : " + term_units[1]);
	}
};

var BoxManager = {

	activeSelectors : new Array(),
	
	id_number : 0,
	
	data_path : {},
	
	reconstructStage1 : function(state){
		
		// Remove the old content.
		$("#courses_div").html("");
		TimetableManipulator.runningSchedule = {};
		BoxManager.id_number = 0;
		
		errorFunc = function() { 
						alert("This data state appears to be corrupted. This could be because someone has tampered "
								+ "with the content, or because it was created with an older version of the time table generator."
								+ "The page will be reloaded to remove the broken artifacts.");
						window.location = window.location;
					};
		
		if(typeof state.type == 'undefined' || typeof state.selectors == 'undefined' || typeof state.school == 'undefined')
			errorFunc();
				
		if(state.type != 'mono' && state.type != 'multi')
			errorFunc();
		
		$('input[name=course_colour_group]').filter('[value=' + state.type + ']').attr('checked', true);
		
		var university_on_record = DataLoader.universities[state.school];
		
		if(typeof university_on_record == 'undefined')
			errorFunc();
		
		// Dump the colour-wheel
		for(var x in TimetableManipulator.colourWheel)
			TimetableManipulator.colourWheel[x] = null;

		DataLoader.reloadData = state;
		DataLoader.setUniversity();
	},
	
	reconstructStage2 : function(state){
		
		var prefixes = ["dep_select_", "course_select_", "core_select_", "tutorial_select_", "lab_select_"];
		
		for(var x = 0; x < state.selectors.length; x++){
		
			var selector = state.selectors[x];
			
			BoxManager.addNewSelector(TimetableManipulator.masterCourseList);
			
			for(var y = 0; y < selector.length; y++){

				if(selector[y] == null && y > 2)
					continue;
				
				if($("#" + prefixes[y] + x + " option[value='" + selector[y] + "']").length > 0){
				
					$("#" + prefixes[y] + x ).val(selector[y]);
					
					if(y < 2)
						$("#advance_button_" + x).click();
				}
				else {
					alert("Cannot find an option with the value '" + selector[y] + "' under this menu. Skipping");
					break;
				}
			}
			
			$("#advance_button_" + x).click();
		}
	},
	
	removeSelector : function(id){
		
		var ans = confirm("Are you sure you want to remove this set of selectors and all associated courses?");
		
		if(!ans)
			return;
		
		var isSet = $('#advance_button_' + id).attr("onclick").indexOf("BoxManager.addCourse(") > -1;
		
		if(isSet)
			$('#reverse_button_' + id).click();
		
		$('#select_set_' + id).remove();
		
		for(var i = BoxManager.activeSelectors.length; i >= 0; i--){
			if(BoxManager.activeSelectors[i] == id){
				BoxManager.activeSelectors.splice(i, 1);
				break;
			}
		}
	},
	
	addNewSelector : function(){
	
		var id_number = BoxManager.id_number;
	
		var parentDiv = $("#courses_div");
		
		var holster = $("<div></div>").attr('id', "select_set_" + id_number);
		
		var dep_select = $('<select></select>').attr('id', "dep_select_" + id_number);
		
		// Default value
		dep_select.append($('<option></option>').html('Select a department...').attr({'selected' : 'selected', 'value' : 'bad'}));
		
		var departments = [];
		
		for(x in TimetableManipulator.masterDepartmentList)
			departments.push(x);
			
		departments.sort();
		
		for(var x = 0; x < departments.length; x++)
			dep_select.append($('<option></option>').html(departments[x]).attr("value", TimetableManipulator.masterDepartmentList[departments[x]]));
			
		var course_select = $('<select></select>').attr({ "disabled": true, "id": "course_select_" + id_number});
		var core_select = $('<select></select>').attr({ "disabled": true, "id" : "core_select_" + id_number});
		var tutorial_select = $('<select></select>').attr({ "disabled": true, "id" : "tutorial_select_" + id_number});
		var lab_select = $('<select></select>').attr({ "disabled": true, "id" : "lab_select_" + id_number});
		
		var advance_button = $('<button></button>').html("Next").attr({"id" : "advance_button_" + id_number, "onclick" : "BoxManager.setCourse("  + id_number + ")"});
		var reverse_button = $('<button></button>').html("Undo").attr({"disabled" : true, "id" : "reverse_button_" + id_number, "onclick" : "BoxManager.setCourse("  + id_number + ")"});
		var remove_button = $('<button></button>').html("Remove").attr({"id" : "remove_button_" + id_number, "onclick" : "BoxManager.removeSelector("  + id_number + ")"});
		
		holster.append(dep_select);
		holster.append(course_select);
		holster.append(core_select);
		holster.append(tutorial_select);
		holster.append(lab_select);
		holster.append(advance_button);
		holster.append(reverse_button);
		holster.append(remove_button);
		
		parentDiv.append(holster);
		
		BoxManager.data_path[id_number] = new Array();
		
		BoxManager.activeSelectors.push(id_number);
		
		BoxManager.id_number++;
	}, 
	
	getData : function(id){
	
		var data_pos = TimetableManipulator.masterCourseList;
		
		for(x in BoxManager.data_path[id])
			data_pos = data_pos[BoxManager.data_path[id][x]];
			
		return data_pos;
	},
	
	returnFromCourse : function(set_number){
	
		$("#dep_select_" + set_number).attr("disabled", false);
		$("#course_select_" + set_number).attr("disabled", true);
		
		$("#course_select_" + set_number).html("");
		
		$('#advance_button_' + set_number).attr("onclick", "BoxManager.setCourse("  + set_number + ")");
		$('#reverse_button_' + set_number).attr({"onclick" : "", "disabled" : true});
		
		BoxManager.data_path[set_number].pop();
	},
	
	setCourse : function(set_number){
		
		// Get selected department
		var selectedOption = $("#dep_select_" + set_number + " option:selected").attr('value');
		
		if(selectedOption == 'bad'){
			
			alert("Please select a department before proceeding...");
			return;
		}
		
		BoxManager.data_path[set_number].push(selectedOption);
		
		$("#dep_select_" + set_number).attr("disabled", true);
		$("#course_select_" + set_number).attr("disabled", false);
		
		var dataInScope = BoxManager.getData(set_number);
		
		// For array position lookup
		var courseListings = {};
		var courseNames = new Array();
		
		for(var x in dataInScope){
		
			var courseInfo = dataInScope[x];
			
			// Check if available
			if(courseInfo['a'] == true){
				
				var name = courseInfo['cod'] + ((typeof courseInfo['n'] == 'undefined')? "" : " " + courseInfo['n']);
				
				name += (settings_parcel.show_term)? " T" + courseInfo['t'] : "";
				name += (settings_parcel.show_tod)? " " + courseInfo['tod'] : "";
				
				courseNames.push(name);
				courseListings[name] = x;
			}
		}
		
		courseNames.sort();
		
		// Default value
		$("#course_select_" + set_number).html("");
		$("#course_select_" + set_number).append($('<option></option>').html('Select a course...').attr({'selected' : 'selected', 'value' : 'bad'}));
		
		for(var x = 0; x < courseNames.length; x++)
			$("#course_select_" + set_number).append($('<option></option>').html(courseNames[x]).attr('value', courseListings[courseNames[x]]));
			
		$('#advance_button_' + set_number).attr("onclick", "BoxManager.setSchoolUnits("  + set_number + ")");
		$('#reverse_button_' + set_number).attr({"onclick" : "BoxManager.returnFromCourse("  + set_number + ")", "disabled" : false});
	},
	
	returnFromSchoolUnits: function(set_number){
	
		$("#course_select_" + set_number).attr("disabled", false);
		$("#core_select_" + set_number).attr("disabled", true);
		$("#lab_select_" + set_number).attr("disabled", true);
		$("#tutorial_select_" + set_number).attr("disabled", true);
		
		$("#core_select_" + set_number).html("");
		$("#lab_select_" + set_number).html("");
		$("#tutorial_select_" + set_number).html("");
		
		$('#advance_button_' + set_number).attr("onclick", "BoxManager.setSchoolUnits("  + set_number + ")");
		$('#reverse_button_' + set_number).attr("onclick", "BoxManager.returnFromCourse("  + set_number + ")");
		
		BoxManager.data_path[set_number].pop();
	},
	
	setSchoolUnits: function(set_number){
	
		// Get selected department
		var selectedOption = $("#course_select_" + set_number + " option:selected").attr('value');
		
		if(selectedOption == 'bad'){
			
			alert("Please select a course before proceeding...");
			return;
		}
		
		BoxManager.data_path[set_number].push(selectedOption);
		
		$("#course_select_" + set_number).attr("disabled", true);
		
		var dataInScope = BoxManager.getData(set_number);
		
		// Default value
		$("#su_select_" + set_number).append($('<option></option>').html('Select a section type...').attr({'selected' : 'selected', 'value' : 'bad'}));
		
		// Load each data set.
		for(var x in dataInScope){
		
			var courseInfo = dataInScope[x];
			
			if(x == 'l' || x == 'tu' || x == 'c'){
			
				var prefix = settings_parcel.school_unit_prefixes[x.substring(0,1)];
				var el_name = settings_parcel.school_unit_names[x.substring(0,1)].toLowerCase();
				
				var id_type = (x == 'l')? "lab" : ((x == 'c')? "core" : "tutorial");
				
				$("#" + id_type + "_select_" + set_number).html("");
				$("#" + id_type + "_select_" + set_number).attr("disabled", false);
				$("#" + id_type + "_select_" + set_number).append($('<option></option>').html('Select a ' + el_name + '...').attr({'selected' : 'selected', 'value' : 'bad'}));
			
				var secListings = {};
				var secNames = new Array();
				
				for(var n in dataInScope[x]){
						
					var name = dataInScope[x][n]['n'];
					secNames.push(name);
					secListings[name] = n;
				}
				
				secNames.sort( function(a,b){return a-b} );
				
				for(var n in secNames)
					$("#" + id_type + "_select_" + set_number).append($('<option></option>').html(prefix + secNames[n].toString()).attr('value', secListings[secNames[n]]));

			}
		}
			
		$('#advance_button_' + set_number).attr("onclick", "BoxManager.addCourse("  + set_number + ")");
		$('#reverse_button_' + set_number).attr("onclick", "BoxManager.returnFromSchoolUnits("  + set_number + ")");
	},
	
	addCourse : function(set_number) {
	
		// Get selected sections.
		var selectedCore = $("#core_select_" + set_number + " option:selected").attr('value');
		var selectedLab = $("#lab_select_" + set_number + " option:selected").attr('value');
		var selectedTut = $("#tutorial_select_" + set_number + " option:selected").attr('value');
		
		var needCore = !(typeof selectedCore == 'undefined');
		var needLab = !(typeof selectedLab == 'undefined');
		var needTut = !(typeof selectedTut == 'undefined');
		
		// Check to ensure all required data has been entered.
		
		var needSet = [ needCore, needLab, needTut ];
		var selectedSet = [ selectedCore, selectedLab, selectedTut];
		var schoolUnitNameIdentifier = ['c', 'l', 't'];
		
		for(var x = 0; x < 3; x++)
		
			if(needSet[x] && selectedSet[x] == 'bad'){
				
				alert("Please select a " + settings_parcel.school_unit_names[schoolUnitNameIdentifier[x]].toLowerCase() + " before proceeding...");
				return;
			}
		
		var schoolUnitTypes = ['c', 'l', 'tu'];
		
		for(var x = 0; x < 3; x++){
		
			if(needSet[x]){
			
				BoxManager.data_path[set_number].push(schoolUnitTypes[x]);
				BoxManager.data_path[set_number].push(selectedSet[x]);
			
				var targetPayload = BoxManager.createTarget(set_number);
			
				TimetableManipulator.importSchoolUnit(targetPayload);
				
				BoxManager.data_path[set_number].pop();
				BoxManager.data_path[set_number].pop();
			}
		}
		
		TimetableManipulator.renderSchedule();
		
		$('#core_select_' + set_number).attr("disabled", true);
		$('#lab_select_' + set_number).attr("disabled", true);
		$('#tutorial_select_' + set_number).attr("disabled", true);
		
		$('#advance_button_' + set_number).attr("disabled", true);
		$('#reverse_button_' + set_number).attr("disabled", false);
		
		$('#reverse_button_' + set_number).attr("onclick", "BoxManager.removeCourse(" + set_number + ")");
	},
	
	removeCourse : function(set_number) {
	
		// Get selecteds sections.
		var selectedCore = $("#core_select_" + set_number + " option:selected").attr('value');
		var selectedLab = $("#lab_select_" + set_number + " option:selected").attr('value');
		var selectedTut = $("#tutorial_select_" + set_number + " option:selected").attr('value');
		
		var needCore = !(typeof selectedCore == 'undefined');
		var needLab = !(typeof selectedLab == 'undefined');
		var needTut = !(typeof selectedTut == 'undefined');
		
		var sectioningData = [{ 'enabled' : needCore, 'type' : 'c', 'choice' : selectedCore}, 
								{ 'enabled' : needLab, 'type' : 'l','choice' : selectedLab},
								{'enabled' : needTut, 'type' : 'tu', 'choice' : selectedTut}
							];
		
		for(var y = 0; y < sectioningData.length; y++){
		
			if(sectioningData[y].enabled){
			
				BoxManager.data_path[set_number].push(sectioningData[y].type);
				BoxManager.data_path[set_number].push(sectioningData[y].choice);
			
				var targetPayload = BoxManager.createTarget(set_number);
			
				TimetableManipulator.removeSchoolUnit(targetPayload);
				
				BoxManager.data_path[set_number].pop();
				BoxManager.data_path[set_number].pop();
			}
		}
		
		TimetableManipulator.renderSchedule();
		
		$('#core_select_' + set_number).attr("disabled", !needCore);
		$('#lab_select_' + set_number).attr("disabled", !needLab);
		$('#tutorial_select_' + set_number).attr("disabled", !needTut);
		
		$('#advance_button_' + set_number).attr("disabled", false);
		$('#reverse_button_' + set_number).attr("disabled", false);
		
		$('#reverse_button_' + set_number).attr("onclick", "BoxManager.returnFromSchoolUnits(" + set_number + ")");
	},
	
	
	createTarget : function(set_number) {
		
		var dpath = BoxManager.data_path[set_number];
		var dep = dpath[0];
		
		var dataTarget = TimetableManipulator.masterCourseList[dpath[0]][dpath[1]];
		
		var targetPayload = jQuery.extend(true, {}, dataTarget);
		
		targetPayload['target'] = dataTarget[dpath[2]][dpath[3]];
		targetPayload['targetType'] = dpath[2].charAt(0).toLowerCase();
		targetPayload['dep'] = dpath[0];
		
		return targetPayload;
	}
};
