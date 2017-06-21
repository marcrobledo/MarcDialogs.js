/* MarcDialogs.js v20170621 - Marc Robledo 2014-2017 - http://www.marcrobledo.com/license */
MarcDialogs=(function(){
	var isIE8=/MSIE 8/.test(navigator.userAgent);
	var canUseHistory=(typeof history.pushState==='function');
	function addEvent(e,t,f){if(isIE8)e.attachEvent('on'+t,f);else e.addEventListener(t,f,false)}

	var Z_INDEX=9000;
	var BUTTON_STRINGS=['Cancel','Accept'];
	var BROWSER_LANG=navigator.language||navigator.userLanguage;
	if(BROWSER_LANG.startsWith('es'))
		BUTTON_STRINGS=['Cancelar','Aceptar'];

	var dialogOverlay=document.createElement('div');
	dialogOverlay.className='dialog-overlay';
	dialogOverlay.style.position='fixed';
	dialogOverlay.style.top='0';
	dialogOverlay.style.left='0';
	dialogOverlay.style.width='100%';
	dialogOverlay.style.height='100%';
	dialogOverlay.style.zIndex=Z_INDEX;
	addEvent(dialogOverlay,'click',_cancel);
	addEvent(window,'load',function(){
		document.body.appendChild(dialogOverlay);
	});

	var sessionId=false;
	var currentDialog=-1;
	var currentDialogs=[];
	var requestAnimationFrame=window.mozRequestAnimationFrame || window.requestAnimationFrame;

	addEvent(window,'resize',function(){
		//for some reason, setting the margins twice works better
		for(var i=0; i<currentDialogs.length; i++){
			_center(currentDialogs[i]);
			_center(currentDialogs[i]);
		}
	});

	if(canUseHistory){
		addEvent(window,'popstate',function(evt){
			if(sessionId){
				if(evt.state && (typeof evt.state.marcDialog === 'number') && evt.state.sessionId===sessionId){
					//console.log('pop: '+evt.state.marcDialog+'<'+currentDialog);
					if(evt.state.marcDialog<currentDialog){
						_goBack();
					}else{
						_goForward();
					}
				}else{
					while(currentDialog>=0){
						_goBack();
					}
				}
			}
		});
	}

	addEvent(document,'keydown',function(evt){
		if(currentDialogs.length && currentDialog>=0){
			if(evt.keyCode==27){ //esc
				(evt.preventDefault)?evt.preventDefault():evt.returnValue=false;
				_cancel();


			}else if(evt.keyCode==9){ //tab
				var dialog=currentDialogs[currentDialog];
				if(dialog.dialogElements[dialog.dialogElements.length-1]===document.activeElement){	
					(evt.preventDefault)? evt.preventDefault():evt.returnValue=false;
					_focus(dialog);
				}
			}
		}
	});

	function _goBack(){
		//console.log('going back');
		currentDialog--;
		_rearrangeDialogs();
	}
	function _goForward(){
		//console.log('going forward');
		currentDialog++;
		_rearrangeDialogs();
	}

	function _cancel(){
		if(currentDialog>=0){
			if(canUseHistory){
				history.go(-1);
			}else{
				_goBack();
			}
		}
	}

	function _focus(dialog){
		for(var i=0; i<dialog.dialogElements.length; i++){
			var elem=dialog.dialogElements[i];
			if((elem.nodeName==='INPUT' && elem.type!=='hidden') || elem.nodeName!=='INPUT'){
				window.setTimeout(function(){elem.focus()},1); //timeout needed
				return true
			}
		}
		return false
	}

	/* Center dialogs */
	function _center(dialog){
		dialog.style.marginLeft='-'+parseInt(dialog.offsetWidth/2)+'px';
		dialog.style.marginTop='-'+parseInt(dialog.offsetHeight/2)-30+'px'
	}


	function _getTopDialog(){
		return (currentDialogs.length)?document.getElementById('dialog-'+currentDialogs[currentDialogs.length-1]):null
	}


	function _purgeQuickDialogs(){
		var i=0;
		while(document.getElementById('dialog-quick'+i)){
			if(currentDialogs.indexOf(document.getElementById('dialog-quick'+i))===-1)
				document.body.removeChild(document.getElementById('dialog-quick'+i));
			i++;
		}
	}

	function _toggleDialogElements(dialog,status){
		for(var i=0;i<dialog.dialogElements.length;i++)
			dialog.dialogElements[i].disabled=status
	}

	function _rearrangeDialogs(){
		if(currentDialog===-1){
			dialogOverlay.className='dialog-overlay';

			for(var i=0; i<currentDialogs.length; i++)
				currentDialogs[i].className=currentDialogs[i].className.replace(/ active/g,'');
			window.setTimeout(_purgeQuickDialogs, 2500);
		}else{
			dialogOverlay.className='dialog-overlay active';

			/* bg previous */
			for(var i=0; i<currentDialog; i++){
				currentDialogs[i].style.zIndex=Z_INDEX-(currentDialog+i);
				_toggleDialogElements(currentDialogs[i], true);
			}

			/* put stacked dialogs behind overlay+enable current dialog */
			for(var i=0; i<16; i++)
				_center(currentDialogs[currentDialog]);//force center a few times
			currentDialogs[currentDialog].className=currentDialogs[currentDialog].className.replace(/ active/g,'')+' active';
			currentDialogs[currentDialog].style.zIndex=Z_INDEX+1;
			_toggleDialogElements(currentDialogs[currentDialog], false);

			/* hide next dialogs */
			for(var i=currentDialog+1; i<currentDialogs.length; i++){
				currentDialogs[i].className=currentDialogs[i].className.replace(/ active/g,'');
				_toggleDialogElements(currentDialogs[i], true);
			}

			_focus(currentDialogs[currentDialog]);
		}
	}

	function _quickDialog(text, f){
		var dialog=document.createElement('div');
		dialog.className='dialog';
		var i=0;
		while(document.getElementById('dialog-quick'+i))
			i++;
		dialog.id='dialog-quick'+i;
		//console.log(i);

		var msg=document.createElement('div');
		msg.style.textAlign='center';
		msg.innerHTML=text;
		dialog.appendChild(msg);


		var buttons=document.createElement('div');
		buttons.className='buttons';
		if(f){
			var btn=document.createElement('button');
			btn.className='colored accept';
			btn.innerHTML=BUTTON_STRINGS[1];
			addEvent(btn,'click', f);

			var btnCancel=document.createElement('button');
			btnCancel.innerHTML=BUTTON_STRINGS[0];
			addEvent(btnCancel,'click', _cancel);

			buttons.appendChild(btn);
			buttons.appendChild(btnCancel);
		}else{
			var btn=document.createElement('button');
			btn.className='colored accept';
			btn.innerHTML=BUTTON_STRINGS[1];
			addEvent(btn,'click', _cancel);
			buttons.appendChild(btn);
		}
		dialog.appendChild(buttons);
		document.body.appendChild(dialog);


		//timeout to let the transition work in some browsers
		var f=function(){MarcDialogs.open(dialog)};
		if(requestAnimationFrame){
			requestAnimationFrame(f);
		}else{
			window.setTimeout(f, 1);
		}
	}

	return{
		//currentDialogs:function(){return currentDialogs},
		//currentDialog:function(){return currentDialog},
		
		open:function(de){
			var nextDialog=(typeof de === 'string')?document.getElementById('dialog-'+de.replace(/^#/,'').replace(/^dialog-/,'')):de;

			nextDialog.style.position='fixed';
			nextDialog.style.top='50%';
			nextDialog.style.left='50%';
			nextDialog.style.zIndex=parseInt(dialogOverlay.style.zIndex)+1;
			if(!nextDialog.dialogElements){
				nextDialog.dialogElements=nextDialog.querySelectorAll('input,textarea,select,button');
				for(var i=0; i<nextDialog.dialogElements.length; i++){
					if(!nextDialog.dialogElements[i].tabIndex)
						nextDialog.dialogElements[i].tabIndex=0;
				}
			}

			currentDialog++;
			currentDialogs[currentDialog]=nextDialog;
			_rearrangeDialogs();


			if(!sessionId)
				sessionId=(new Date()).getTime();
			if(canUseHistory)
				history.pushState({marcDialog:currentDialog,sessionId:sessionId}, null, null);
		},

		replace:function(){
			
		},

		close:_cancel,

		closeAll:function(){
			currentDialog=-1;
			_rearrangeDialogs();
		},

		/* Quick dialogs */
		alert:function(t){
			_quickDialog(t)
		},
		confirm:function(t,f){
			_quickDialog(t,f)
		}
	}
})();