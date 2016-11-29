var course_colour = '#CCFF9A';
var conflict_colour = '#FABD4E';

var university_identification = null;
			
var site_location = "http://www.timetablegenerator.com";
			
// Settings for the particular school.
var settings_parcel = null;

var DataLoader = {

	universities : null,
	
	reloadData : null,
	
	buildTimeTable : function(term_number){
		
		var term_prefix = "term" + term_number;
		
		var table = $("<table></table>").attr({"id" : term_prefix + "_table", "class" : "term"});
		
		table.append($("<tr></tr>").append(
				$("<th></th>").attr({"id" : term_prefix + "_title", "class" : "title", "colspan" : 6}).html("TERM " + term_number)
			)
		);
		
		table.append($("<tr></tr>").append(
				$("<td></td>").attr({"id" : term_prefix + "_details", "colspan" : 6})
			)
		);
		
		var hour = 8;
		var minute = 0;
		
		var days = ['mo', 'tu', 'we', 'th', 'fr'];
		
		while( (hour == 22 && minute == 0) ||  (hour < 22)){

			var time_row = $("<tr></tr>").attr("id", term_prefix + "_" + hour.toString() + minute.toString());
			
			time_row.append($("<th></th>").attr("bgcolor", "#CDCDCB").html(DataLoader.timeAsString(hour, minute)));
				
			for(var x = 0; x < days.length; x++){
				
				var day_slot = term_prefix + "_" + days[x] + "_" + hour.toString() + minute.toString();
				
				time_row.append($("<td></td>").attr({"id" : day_slot, "class" : "daytime_slot"}));
			}
			
			table.append(time_row);
			
			if(minute == 30){
				minute = 0;
				hour++;
			}
			else
				minute = 30;
		}
		
		$("#term_" + term_number + "_tab").html(table);
	},
	
	/**
	 * Returns a string representation of the current time,
	 * from an hour and minute.
	 */
	timeAsString : function(hour, minute){
		
		return hour.toString() + ":" + ((minute < 10)? "0" :"") + minute.toString();
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
			url: site_location + "/sched.php?data=" + university_identification.prefix,
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

	refTable : {},
	runningSchedule : {},
	masterCourseList : null,
	masterDepartmentList : null,
	
	sameCourse : function(schoolUnitA, schoolUnitB){
	
		if(schoolUnitB == null && schoolUnitA == null)
			return true;
		
		if(schoolUnitB == null || schoolUnitA == null)
			return false;
		
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
	
	/**
	 * Rounds a unit of time [hour, minutes] to the nearest half-hour segment.
	 * For example, 6:55 rounds to 7:00 and 6:05 rounds to 6:00. 6:45 will
	 * round to 7:00 while 6:44 will round to 6:30.
	 */
	roundTime: function(hour, minute){
	
		if(minute != 30 && minute != 0){
			
			if(minute > 30){
				if(minute - 30 >= 15){
				
					minute = 0;
					hour++;
				}
				else
					minute = 30;
			}
			else {
			
				if(30 - minute >= 15)
					minute = 0;
				else 
					minute = 30;
			}
		}
		
		return [hour, minute];
	},
	
	importSchoolUnit : function(schoolUnit){
		
		if(schoolUnit['t'] == 3){

			var targets = TimetableManipulator.splitTargets(schoolUnit);
			
			TimetableManipulator.importSchoolUnit(targets.first);
			TimetableManipulator.importSchoolUnit(targets.second);
			
			return;
		}
		
		var times = schoolUnit['target']['ti'];
		
		// Find an available reference number.
		var refNum = 0;
		
		while(refNum in TimetableManipulator.refTable)
			refNum++;
		
		TimetableManipulator.refTable[refNum] = schoolUnit;
		
		for(var x = 0; x < times.length; x++){
			
			// The time-space for this course exists as an array.
			var day_prefix = times[x][1];
			var hour = times[x][2];
			var minute = times[x][3];
			var finalHour = times[x][4];
			var finalMinute = times[x][5];
			
			// Artificially insert the location as a 'loc' key into the target for
			// readability in complicated code.
			schoolUnit['target']['loc'] = times[x][6];
			
			// Round the starting time to the slot it begins existing in, and the ending slot
			// to the time it ends in.
			
			// Constrain the beginning time.
			
			var r = TimetableManipulator.roundTime(hour, minute);
			
			hour = r[0];
			minute = r[1];
			
			// Constrain the ending time.
			
			var r = TimetableManipulator.roundTime(finalHour, finalMinute);
			
			finalHour = r[0];
			finalMinute = r[1];
			
			var time_set = [];
			
			while( (hour == finalHour && minute < finalMinute) || (hour < finalHour) ){
				
				time_set.push([schoolUnit['t'], day_prefix, hour, minute]);
					
				if(minute == 30){
					minute = 0;
					hour++;
				}
				else
					minute = 30;
			}
			
			if(refNum in TimetableManipulator.runningSchedule)
				TimetableManipulator.runningSchedule[refNum].push(time_set);
			else
				TimetableManipulator.runningSchedule[refNum] = [time_set];
		}	
	},
	
	removeSchoolUnit: function(schoolUnit){
	
		var times = schoolUnit['target']['ti'];
		
		// Remove and free up any used colours.
		for(var colour in TimetableManipulator.colourWheel){
			if(TimetableManipulator.sameCourse(TimetableManipulator.colourWheel[colour], schoolUnit)){
				TimetableManipulator.colourWheel[colour] = null;
				break;
			}
		}
			
		if(schoolUnit['t'] == 3){

			var targets = TimetableManipulator.splitTargets(schoolUnit);
			
			TimetableManipulator.removeSchoolUnit(targets['first']);
			TimetableManipulator.removeSchoolUnit(targets['second']);
			
			return;
		}
		
		// Find the number associated with the object;
		for(var x in TimetableManipulator.refTable)
			if(TimetableManipulator.schoolUnitsEqual(TimetableManipulator.refTable[x], schoolUnit)){
				delete TimetableManipulator.runningSchedule[x];
				delete TimetableManipulator.refTable[x];
				break;
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
		
		// Only show the tabs if there are recorded courses.
		if(Object.keys(TimetableManipulator.runningSchedule).length == 0){
			
			$("#tabs").hide();
			$("#pre_tabs").show();
		}
		else {
			$("#tabs").show();
			$("#pre_tabs").hide();
		}
		
		var build_term = {
				
			1: false,
			2: false,
			3: false
		}
		
		// Scan the existing courses and see which tabs should be built.
		for(var x in TimetableManipulator.runningSchedule){
			
			var times = TimetableManipulator.runningSchedule[x];
			
			for(var y in times){
				var z = times[y][0][0];
				
				if(z < 3)
					build_term[z] = true;
				else
					build_term[3] = true;
			}
		}
			
		var titles = [ "Winter (Term 1)", "Spring (Term 2)", "Summer" ];
		var divs = [ "term_1_tab", "term_2_tab", "term_summer_tab" ];
		
		// Destroy all existing tabs.
		for(var y = 0; y < 3; y++)
			$("#tabs").tabs('remove', 0);
		
		for(var y = 1; y < 4; y++){
			
			if(build_term[y]){
				
				// Rebuild the content div.
				$("#tabs").append($("<div></div>").attr("id", divs[y-1]));
				
				// Add the tab back into the diagram.
				$("#tabs").tabs('add', "#" + divs[y - 1], titles[y - 1], y);
				
				DataLoader.buildTimeTable(y);
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
		
		var term_hours = [0,0];
		var term_units = [0,0];
		
		var saturday_built = [false, false];
		
		var visited = [];
		var taken_slots = {};
		var conflict_blobs = {};
		var refTable = {};
		var nextRefNum = 0;
		
		// Generates course info to be displayed about the school unit.
		var generate_course_info = function(x) {
			
			var supervisor = "<font color='blue'>";
			
			if(x['targetType'] == "c"){
				if(x['target']['sups'].length > 0)
					supervisor +=  "</br>" + x['target']['sups'][0];
			}
			
			supervisor += "</font>";
						
			return ((settings_parcel.uses_depheaders)? x['dep'] + " " : "")
				+ x['cod'] + " " + settings_parcel.school_unit_prefixes[x['targetType']]
				+ x['target']['n']
				+ supervisor
				+ ((settings_parcel.uses_serials)? "</br>" + x['target']['sn'] : "")
				+ ((typeof x['target']['loc'] != 'undefined')? ("</br>" + x['target']['loc']) : "")
				+ ((x['target']['EOW'])? 
					"</br><font color='red'>" + settings_parcel.eow_word + "</font>" : "");
		}
		
		var generate_time_id = function(x) {
			
			return "#term" + x[0].toString() 
				+ "_" + x[1] + "_" + x[2].toString()
				+ x[3].toString();	
		}
		
		// Clear existing data from the schedule.
		TimetableManipulator.clearSchedule();
		
		// Check which time table templates should be built and build them.
		
		var to_build = [];
		
		for(var x in TimetableManipulator.runningSchedule){
		
			TimetableManipulator.runningSchedule[x][0]
		}
		
		for(var x in TimetableManipulator.runningSchedule){
			
			var su = TimetableManipulator.refTable[x];
			
			var times = TimetableManipulator.runningSchedule[x];
			var master_element;
			
			var seen = false;
			
			var time_taken = [0, 0];
			
			// Generate a reference ID for finding conflicts.
			
			var refNum = nextRefNum++;
			
			refTable[refNum] = su;
			
			// Check if the course has already been visited so we don't
			// add its units twice.
			for(y = 0; y < visited.length; y++)
				if(TimetableManipulator.sameCourse(visited[y], su)){
					seen = true;
					break;
				}
			
			if(!seen){
				visited.push(su);
				
				var units = su['u'];
				
				if(su.termThree){
					term_units[0] += units/2;
					term_units[1] += units/2;
				}
				else
					term_units[su['t'] - 1] += units;
			}
			
			// Process each scheduled component of the school unit.
			for(var w in times){
				
				var time_comp = times[w];
				
				// Process elements, stopping when conflicts are detected. Each time element
				// is checked for potential conflict.
				for(var y = 0; y < time_comp.length; y++){
					
					if(time_comp[y][1] == 'sa')
						if(!saturday_built[time_comp[y][0] - 1]){
							TimetableManipulator.buildSaturday(time_comp[y][0]);
							saturday_built[time_comp[y][0] - 1] = true;
						}
					
					var time_id = generate_time_id(time_comp[y]);
					
					// Check if the time slot is already occupied.
					if(time_id in taken_slots){
						
						time_taken = [0, 0];
						
						var occupier_id = taken_slots[time_id]['su_id'];
						var occupier_val = taken_slots[time_id]['t_id'];
							
						// If the occupier is a course, create a new conflict blob. Otherwise,
						// add to the existing conflict blob.
						if(!(occupier_id in conflict_blobs)){
						
							var new_conflict_id = nextRefNum++;
							
							conflict_blobs[new_conflict_id] = {};
							
							conflict_blobs[new_conflict_id][occupier_id] = occupier_val;
							
							// Take ownership of everything owned by the previous occupier.
							for(var z in taken_slots)
								if(occupier_id == taken_slots[z]['su_id'] && occupier_val == taken_slots[z]['t_id'])
									taken_slots[z] = {'su_id' : new_conflict_id, 't_id' : -1};
							
							occupier_id = new_conflict_id;
						}
						
						conflict_blobs[occupier_id][refNum] = w;
								
						// Mark the time slots owned by the new conflicting school unit with
						// the original occupying element to merge them into the conflict blob.
						for(var z = 0; z < time_comp.length; z++){
						
							var internal_time_id = generate_time_id(time_comp[z]);
							
							// If the next time slot is already taken, merge that
							// conflict blob to the current one.
							if(internal_time_id in taken_slots){
							
								var next_blob = taken_slots[internal_time_id];
								var next_blob_id = next_blob['su_id'];
								var next_blob_t_id = next_blob['t_id'];
								
								// Make sure the time is not one already owned by the blob.
								if(next_blob_id != occupier_id){
									
									// If the conflicting elements for the current time slot do not already exist.
									if(next_blob_id in conflict_blobs){
										
										var next_blob_content = conflict_blobs[next_blob];
										
										for(var w in next_blob_content)
											conflict_blobs[occupier_id][w] = conflict_blobs[next_blob][w];
										
										delete conflict_blobs[next_blob_id];
									}
									else
										conflict_blobs[occupier_id][next_blob_id] = next_blob_t_id;
									
									// Take all the spaces owned by that school unit or blob.
									for(w in taken_slots)
										if(taken_slots[w]['su_id'] == next_blob_id && taken_slots[w]['t_id'] == next_blob_t_id)
											taken_slots[w] = {'su_id' : occupier_id, 't_id' : -1};
								}
							}
							
							taken_slots[internal_time_id] = {'su_id' : occupier_id, 't_id' : -1};
						}
							
						break;
					}
					
					taken_slots[time_id] = {'su_id' : refNum, 't_id' : w};
					
					if(time_comp[y][0] == 1)
						time_taken[0] += 0.5;
					else
						time_taken[1] += 0.5;
					
					if(y == 0){
						
						master_element = $(generate_time_id(time_comp[y]));
						
						var setColour = TimetableManipulator.getColour(su);
						
						master_element.attr({"bgcolor" : setColour, "rowspan" : 1});
						master_element.css("background", setColour);
						
						var supervisor = "<font color='blue'>";
						
						if(x['targetType'] == "c"){
							if(x['target']['sups'].length > 0)
								supervisor +=  "</br>" + su['target']['sups'][0];
						}
						
						supervisor += "</font>";
						
						master_element.html(generate_course_info(su));
						
					}
					else {
						$(generate_time_id(time_comp[y])).remove();
						master_element.attr("rowspan", parseInt(master_element.attr("rowspan")) + 1);
					}
				}
			}
			
			term_hours[0] += time_taken[0];
			term_hours[1] += time_taken[1];
		}
		
		// Process the conflicting elements.
		for(var x in conflict_blobs){

			var conflict_timespan = [];
			var conflict_set = conflict_blobs[x];
			
			var is_conflict = true;
			
			// Check to make sure that the courses actually conflict and are not just alternating.
			for(var y in conflict_set){
				for(var z in conflict_set){
					if(z != y){
						if(!TimetableManipulator.sameCourse(y, z)){
							is_conflict = true;
							break;
						}
						else{
							if(!(y['EOW'] == true && z['EOW'] == true)){
								is_conflict = true;
								break;
							}
						}
					}
				}
			}
			
			// Determine the starting and ending times of the conflict blob.
			for(var y in conflict_set){
			
				var times = TimetableManipulator.runningSchedule[y][conflict_set[y]];
				
				for(var z = 0; z < times.length; z++){
					
					var inserted = false;
					
					for(var w = 0; w < conflict_timespan.length; w++){
						
						// If the time has already been inserted, do not insert it again.
						if(times[z][2] == conflict_timespan[w][2] && times[z][3] == conflict_timespan[w][3]){
							inserted = true;
							break
						}
						if(times[z][2] == conflict_timespan[w][2] && times[z][3] < conflict_timespan[w][3]){
							inserted = true;
							break;
						}
						if(times[z][2] < conflict_timespan[w][2] 
							|| (times[z][2] == conflict_timespan[w][2] 
								&& times[z][2] < conflict_timespan[w][2]) ){
							conflict_timespan.splice(w, 0, times[z]);
							inserted = true;
							break;
						}
					}
					if(!inserted)
						conflict_timespan.push(times[z]);
				}
			}
			
			// Delete all the overrun timeslots.
			for(var y = 1; y < conflict_timespan.length; y++)
				$(generate_time_id(conflict_timespan[y])).remove();
			
			// Build the conflict timeslot.
			var conflict_head = $(generate_time_id(conflict_timespan[0]));
			
			conflict_head.attr("rowspan", conflict_timespan.length);
			
			if(is_conflict){
				conflict_head.attr("bgcolor", conflict_colour);
				conflict_head.css("background", conflict_colour);
			}
			else {
			
				var setColour = TimetableManipulator.getColour(course_set[0]);
				
				conflict_head.attr("bgcolor", setColour);
				conflict_head.css("background", setColour);
			}
			
			var course_data = [];
			
			// Create conflict data
			for(var y in conflict_set)
				course_data.push(generate_course_info(refTable[y]));
			
			var final_course_data = "";
			
			for(var y = 0; y < course_data.length; y++){
				
				final_course_data += course_data[y];
				
				if(y != course_data.length - 1){
					final_course_data += "</br><font color='red'>";
					final_course_data += (is_conflict)? "*** CONFLICT ***" : settings_parcel.eow_word;
					final_course_data += "</font></br>";
				}
			}
			
			conflict_head.html(final_course_data);
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