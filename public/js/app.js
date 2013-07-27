$(document).ready(function(){
	$('form').attr('novalidate','novalidate');
	$(document).keyup(App.catchKey);
	$('body').bind('click',App.bodyClick);
	$('#profile-menu').bind('click',App.profileMenuClick);
	$('.dropdown-menu').bind('click',App.dropdownMenuClick);
	$('#submit-note').bind('click',App.submitNote);
	$('#delete-note-button').bind('click',App.deleteNote);
	$("#submit-message").bind('click',App.sendMessage);
	$(".card-slide").bind('click',App.cardSlide);
	$(".prev-card").on('click',App.prevCard);
	$(".next-card").on('click',App.nextCard);
	$("#black").bind('click',App.closeCards);
	$(".checkbox-switcher").bind('click',App.switchSwitcher);
	$("#add-speaker-click").bind('click',App.addSpeaker);
	$(".save-profile").bind('click',App.saveProfile);
	$('.datepicker').datetimepicker({ dateFormat: "yy-mm-dd",'timeFormat':"HH:mm" });
	$('.color').bind('click',App.changeCardType);
	$('#addCard').bind('click',App.addCard);
	$('.editCard').bind('click',App.editCard);
	$('.button-speakers-edit').bind('click',function(){
		App.editSpeaker($(this).attr('data-id'));
	});
	
	$('#EventAddress').bind('blur',App.geocode);
	$('.sendbc').bind('click',App.sendbcinit);
	
	$('.event-item, .user-short-info, .home-box-item').bind('click',function(){
		
		var go = $(this).find('.golink').attr('href');
		if(go){
			window.location = go;
			return false;
		}
		
	});
	
	$('.expellink').bind('click',function(e){
		e.stopPropagation();
	});
	
	$('.bigpicture').bind('click',function(e){
		$("#bigavatar").hide();
		$("#black").show();
		$("#bigavatar").html('<img src="'+$(this).attr('data-big-picture')+'">');
		var left = ($('body').width()/2)-120;
		$("#bigavatar").css({left:left}).fadeIn();
		
		e.stopPropagation();
		return false;
	});
	
	$('.email-invite').bind('click',function(){
		$("#black").show();
		var left = ($('body').width()/2)-200;
		$("#invite-form-popup").css({left:left}).fadeIn();
		return false;
	});
	
	$('#invite-form-popup .submit-btn').bind('click',function(){
		$.ajax({
			url:'/speakers/add.json',
			type:'POST',
			data:$("#invite-form-popup form").serialize(),
			success:function(data){
				if(data.success){
					alert("User has been invited");
					$('.email-invite').hide();
					App.closeCards();
					window.location = '/events/speakers/'+$('#ieventId').val();
				} else {
					if(data.errorcode==1){
						if(confirm("There is already existing EventMost user with email you provided: "+data.User.first_name+" "+data.User.last_name+". Do you want to add him and delete current account? If not provide other email for this guest speaker.")){
							$('#force').val('delete');
							$('#invite-form-popup .submit-btn').click();
						} 
					} else {
						if(data.validationErrors.user_id){
							alert("User has been invited");
							$('.email-invite').hide();
							App.closeCards();
							window.location = '/events/speakers/'+$('#ieventId').val();
						}
					}
				}
			},
			error:function(data){
				alert("Error please try again");
			}
		})
		return false;
	});
	
});



App = {
		sendTo:0,
		cardDownloaded:false,
		cardCurrent: null,
		cardWidth : null,
		cardMax: null,
		users: [],
		bodyClick:function(e){
			$('.profile-menu').hide();
		},
		profileMenuClick:function(e){
			$('.profile-menu').toggle();
			e.stopPropagation();
		},
		dropdownMenuClick:function(e){
			e.stopPropagation();
		},
		submitNote:function(e){
			$("#AddEditNote").submit();
		},
		deleteNote: function(e){
			$("#delete-note").click();
			e.preventDefault();
		},
		sendMessage: function(e){
			$("#AddMessage").submit();
		},
		sendbcinit:function(){
			var elem = this;
			App.sendTo = $(this).attr('data-userid');
			if(App.cardDownloaded){
				App.cardSlide();
			} else {
				$.get('/cards/get',function(data){
					$('#main-content').append(data);
					$(".prev-card").on('click',App.prevCard);
					$(".next-card").on('click',App.nextCard);
					$(".sendcard").on('click',App.sendCard);
					
					App.cardDownloaded = true;
					App.cardSlide();
					$(elem).replaceWith('<span class="sentbclabel">Business card sent</span>');
				});
			}
			
			return false;
		},
		changeCardType:function(){
			var type = $(this).attr('data-id');
			$('.cardform').attr('id','card-'+type);
			$('#CardCardTypeId').val(type);
		},
		sendCard:function(){
			var cardId = $(this).attr('data-cardid');
			
			AjaxClient.sendBC(cardId,App.sendTo,function(){
				App.closeCards();
			});
			return false;
		},
		editCard:function(){
			AjaxClient.getCard($(this).attr('rel'),function(data){
				App.addCard();
				$('.ciavatar img').attr('src',data.Card.picture);
				$('.cardform').attr('id','card-'+data.Card.card_type_id);
				$('.pad-area form').attr('action',$(this).attr('href'));
				$('#CardId').val(data.Card.id);
				$('#CardFirstname').val(data.Card.firstname);
				$('#CardLastname').val(data.Card.lastname);
				$('#CardPosition').val(data.Card.position);
				$('#CardAdress').val(data.Card.adress);
				$('#CardZip').val(data.Card.zip);
				$('#CardCity').val(data.Card.city);
				$('#CardPhone').val(data.Card.phone);
				$('#CardEmail').val(data.Card.email);
				$('#CardTwitter').val(data.Card.twitter);
				$('#CardWeb').val(data.Card.web);
			})
			
			return false;
		},
		addCard:function(){
			$('.pad-area form').attr('action','/cards/add');
			left = 88;
			App.cardWidth = $(".card-item").width() + parseInt($(".card-item").css('margin-left')) + parseInt($(".card-item").css('margin-right'));
			$('.scroll-box .card-item').hide();
			$(".cardform").each(function(){
				$(this).appendTo(".scroll-box");
				$(".scroll-box").width($(".scroll-box").width() + 10 + $(this).width());	
			});
			$(".prev-card").hide();
			$(".next-card").hide();
			App.cardCurrent = 0;
			$(".scroll-box").css('left',left - App.cardWidth * App.cardCurrent);
			$("#black").show();
			
			for(i in loggedUser.User){
				if(i!='id'){
					field=i.replace("first_name",'firstname');
					field=field.replace("last_name",'lastname');
					field=field.replace("website",'web');
					$('#CardIndexForm input[name="data[Card]['+field+']"]').val(loggedUser.User[i]);
				}
				
				$('#CardIndexForm input[name="data[Card][adress]"]').val('');
				$('#CardIndexForm input[name="data[Card][city]"]').val('');
				$('#CardIndexForm input[name="data[Card][zip]"]').val('');
				$('#CardIndexForm input[name="data[Card][phone]"]').val('');
				$('#CardIndexForm input[name="data[Card][twitter]"]').val('');
				
			}
			
			$(".cardform").show();
			$(".cards-scroll-bar").fadeIn();
			return false;
			
			
		},
		cardSlide: function(e){
			left = 88;
			App.cardWidth = $(".card-item").width() + parseInt($(".card-item").css('margin-left')) + parseInt($(".card-item").css('margin-right'));
			var id = $(this).attr('rel');
			
			var i = 0;
			$(".card-item").not('.cardform').each(function(){
				var cid = $(this).attr('id');
				if($(this).attr('data-id') ==  id) {
					App.cardCurrent = i;
				}
				++i;
				$(this).appendTo(".scroll-box");
				$(".scroll-box").width($(".scroll-box").width() + 10 + $(this).width());	
			});
			$('.scroll-box .card-item').show();
			$(".cardform").hide();
			App.cardMax = i-1;
			$(".scroll-box").css('left',left - App.cardWidth * App.cardCurrent);
			$("#black").show();
			if(App.cardCurrent > 0) {
				$(".prev-card").show();
			}
			if(App.cardMax - App.cardCurrent > 0) {
				$(".next-card").show();
			}
			$(".card-item").not('.cardform').show();
			$(".cards-scroll-bar").fadeIn();
			return false;
		},
		nextCard: function(){
			++App.cardCurrent;
			$(".prev-card, .next-card").fadeOut();
			var delta = parseInt($(".scroll-box").css('left')) - App.cardWidth;
			$(".scroll-box").animate({left: delta},1000,function(){App.checkScrollers()});
		},
		prevCard: function(){
			--App.cardCurrent;
			$(".prev-card, .next-card").fadeOut();
			var delta = parseInt($(".scroll-box").css('left')) + App.cardWidth;
			$(".scroll-box").animate({left: delta},1000,function(){App.checkScrollers()});
		},
		checkScrollers: function(callback){
			if(App.cardCurrent > 0) {
				$(".prev-card").fadeIn();
			}
			if(App.cardMax - App.cardCurrent > 0) {
				$(".next-card").fadeIn();
			}
		},
		closeCards:function(){
			$("#black").hide();
			$(".card-item").hide();
			$(".cards-scroll-bar").hide();
			$("#bigavatar").hide();
			$("#invite-form-popup").hide();
		},
		catchKey: function(key){
			if(key.keyCode == 27) {
				App.closeCards();
			}
		},
		switchSwitcher: function() {
			var parent = $(this).attr('id');
			var id = $("#" + parent + " .switch-active").attr('id');
			var type = parent.split('-');
			var pos = id.split('-');
			
			$("#"+id).removeClass('switch-active');
			if(pos[1] == 'on') {
				$("#"+pos[0] + "-" + 'off').addClass('switch-active');
				if(type[2] == 'checkbox') {
					$("#Event" + pos[0]).prop('checked', false);
				} else if(type[2] == 'input') {
					$("#Event" + pos[0]).prop('disabled', true).val('');
				} else if(type[2] == 'password'){
					$("#Event" + pos[0]).prop('checked', false);
					$("#EventPasswordProtected").prop('checked', false);
					$("#EventPassword").prop('disabled', true).val('');
					$('#password-cont').hide();
				} else if(type[2] == 'tweet'){
					
					$("#EventDefaultTweet").prop('disabled', true).css({opacity:0.7});
					
				}
			} else {
				$("#"+pos[0] + "-" + 'on').addClass('switch-active');
				if(type[2] == 'checkbox') {
					$("#Event" + pos[0]).prop('checked', true);
				} else if(type[2] == 'input') {
					$("#Event" + pos[0]).prop('disabled', false);
				} else if(type[2] == 'password'){
					$("#EventPasswordProtected").prop('checked', true);
					$("#EventPassword").prop('disabled', false);
					$('#password-cont').show();
				} else if(type[2] == 'tweet'){
					$("#EventDefaultTweet").prop('disabled', false).css({opacity:1});
				}
			}
		},
		checkSwitches : function(){
			$("input[type=checkbox]").each(function(){
				if($(this).is(':checked')) {
					var id = $(this).attr('id');
					var name = id.substr(5);
					$("#" + name + "-off").removeClass('switch-active');
					$("#" + name + "-on").addClass('switch-active');
					if(name == 'PasswordProtected') {
						$("#EventPassword").prop('disabled', false);
						$('#password-cont').show();
					}
				}
			});
			if($("#EventAddress").val() != '') {
				$("#EventAddress").prop('disabled', false);
				$("#Address-off").removeClass('switch-active');
				$("#Address-on").addClass('switch-active');
			}
		},
		addSpeaker: function(e){
			var email = $("#SpeakerEmail").val();
			var name = $("#SpeakerFirstName").val();
			var surname = $("#SpeakerLastName").val();
			if(App.validateEmail(email) || name!='' || surname!='') {
				$("#SpeakerEmail,#SpeakerFirstName,#SpeakerLastName").val('');
				var oneuser = {first_name:name, last_name: surname, email: email};
				App.users.push(oneuser);
				$(".speaker-item-copy").clone().removeClass('speaker-item-copy').addClass('speaker-item').html(name + " " + surname + " : " + email).prependTo('.speaker-add');
			}
			$("#SpeakersList").val(JSON.stringify(App.users));
			e.preventDefault();
		},
		editSpeaker:function(id){
			$('#addSpeaker').val('Edit speaker');
			$('#SpeakerAddForm').attr('action','/speakers/complete/'+id);
			for(i in SPEAKERS){
				var spk = SPEAKERS[i];
				if(spk.Speaker.id==id){
					$('#SpeakerSpeakerId').val(spk.Speaker.id);
					$('#SpeakerFirstName').val(spk.User.first_name);
					$('#SpeakerLastName').val(spk.User.last_name);
					$('#SpeakerPosition').val(spk.User.position);
				}
			}
			return false;
		},
		validateEmail: function (email) { 
		    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		    return re.test(email);
		},
		saveProfile: function(e){
			var elem = this
			params = {};
			params.userId =  $(elem).attr('rel');
			if(confirm("Allow user to receive notification  you saved his/her profile?")){
				params.notify = 1;
			} else {
				params.notify = 0;
			}
			
			AjaxClient.addUserToFav(params,function(data){
				if($(elem).hasClass('margin-left-10')) {
					$(elem).replaceWith('<span class="margin-left-10">Saved</span>');
				} else {
					$(elem).replaceWith('<span class="user-links-bottom-clicked">Saved</span>');
				}
				
			});
			e.preventDefault();
		},
		
		geocode:function(){
			$('input[type=submit]').attr('disabled', 'disabled');
			$('#latlng').show();
			$('#formatted_address').html('getting location...');
			$('#lat').val('');
			$('#lng').val('');
			params = {};
			params.address =  $(this).val();
			AjaxClient.geocode(params,function(data){
				if(data.length){
					for(i in data){
						loc = data[i];
						//$('#formatted_address').html(loc.formatted_address+' ('+loc.geometry.location.lat+','+loc.geometry.location.lng+')');
						$('#formatted_address').html('');
						$('#lat').val(loc.geometry.location.lat);
						$('#lng').val(loc.geometry.location.lng);
						break;
					}
				} else {
					$('#formatted_address').html('not found');
				}
				$('input[type=submit]').removeAttr('disabled');
			});
		},
		
		rgeocode:function(){
			params = {};
			params.address =  $(this).val();
			AjaxClient.rgeocode(params,function(data){
				//console.log(data);
			});
		}
}


AjaxClient = {
		
		API_URL:"",
		
		
		initOptions:function (apiMethod,queryParams, methodSuccessCallback, methodErrorCallback){

		    if (typeof methodSuccessCallback == "undefined") {
		        methodSuccessCallback = function(){
		        };
		    }
		    
		    if (typeof methodErrorCallback == "undefined") {
		        methodErrorCallback = function(){
		        };
		    }
		    if (typeof queryParams == "undefined") {
		    	queryParams = [];
		    }

		    var options;
		    var data = {};
		    data.params = [];
		    data.version="1.1";
		    var url = AjaxClient.API_URL+'/'+apiMethod+'.json?'+$.param(queryParams);
		    options = {
		        url: url,
		        type: 'GET',
		        dataType: 'json',
		        data:data,
		        success: function(data, status){
		        	AjaxClient.successCallback(methodSuccessCallback, data, status)
		        },
		        cache: false,
		        error: function(data, status){
		        	AjaxClient.errorCallback(methodErrorCallback, data, status)
		        }
		    }
		    return options;
		},

		successCallback:function (callback, data, status){
		    callback.apply(this, Array.prototype.slice.call(arguments, 1));
		},

		errorCallback:function (callback, data, status){
		    callback.apply(this, Array.prototype.slice.call(arguments, 1));
		},
		
		eventsNear:function(params,onsuccess){
			try {
				var options = AjaxClient.initOptions('near',params,onsuccess);
				options.data.params = Array.prototype.slice.call(arguments,0,-1);
				options.data = options.data;
		        $.ajax(options);
		    } 
		    catch (err) {
		        console.error('Error initilizing ajax object for getUserPosts');
		        console.error(err);
		    }
		},
		
		getCard:function(id,onsuccess){
			var params = {};
			try {
				var options = AjaxClient.initOptions('cards/'+id,params,onsuccess);
				options.data.params = Array.prototype.slice.call(arguments,0,-1);
				options.data = options.data;
		        $.ajax(options);
		    } 
		    catch (err) {
		        console.error('Error initilizing ajax object for getCard');
		        console.error(err);
		    }
		},
		
		addUserToFav: function(params,onsuccess) {
			try {
				var options = AjaxClient.initOptions('users/addToFavourites',params,onsuccess);
				options.data.params = Array.prototype.slice.call(arguments,0,-1);
				options.data = options.data;
		        $.ajax(options);
		    } 
		    catch (err) {
		        console.error('Error initilizing ajax object for getUserPosts');
		        console.error(err);
		    }
		},
		sendBC: function(cardId,userId,onsuccess) {
			params = {};
			try {
				var options = AjaxClient.initOptions('sharedcards/send/'+cardId+'/'+userId,params,onsuccess);
				options.data.params = Array.prototype.slice.call(arguments,0,-1);
				options.data = options.data;
		        $.ajax(options);
		    } 
		    catch (err) {
		        console.error('Error initilizing ajax object for sendBC');
		        console.error(err);
		    }
		},
		geocode:function(params,onsuccess){
			try {
				var options = AjaxClient.initOptions('geocode',params,onsuccess);
				options.data.params = Array.prototype.slice.call(arguments,0,-1);
				options.data = options.data;
		        $.ajax(options);
		    } 
		    catch (err) {
		        console.error('Error initilizing ajax object for geocode');
		        console.error(err);
		    }
		},
		rgeocode:function(params,onsuccess){
			try {
				var options = AjaxClient.initOptions('rgeocode',params,onsuccess);
				options.data.params = Array.prototype.slice.call(arguments,0,-1);
				options.data = options.data;
		        $.ajax(options);
		    } 
		    catch (err) {
		        console.error('Error initilizing ajax object for rgeocode');
		        console.error(err);
		    }
		}
}