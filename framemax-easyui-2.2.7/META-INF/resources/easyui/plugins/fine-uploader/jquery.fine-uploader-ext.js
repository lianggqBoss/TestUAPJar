/**
 * fineuploader扩展
 * 
 */
(function($) {
	var _fineuploader = $.fn.fineUploader;
	var isExt = !(qq.chrome() || qq.opera());
	var templates = {
		"default" : $url("/easyui/plugins/fine-uploader/templates/default.txt"),
		"gallery" : $url("/easyui/plugins/fine-uploader/templates/gallery.txt"),
		"list" : $url("/easyui/plugins/fine-uploader/templates/list.txt")
	};
	var messages= {
        typeError: "{file} 文件格式无效。 请选择有效的文件： {extensions}。",
        sizeError: "{file} 文件大小超过了{sizeLimit}字节的限制。",
        minSizeError: "{file} 文件大小没达到 {minSizeLimit}字节的限制。",
        emptyError: "{file} 文件是空的，请选择有效的文件！",
        noFilesError: "请选择文件",
        tooManyItemsError: "上传文件数量为 ({netItems})， 超过了{itemLimit}的限制。",
        onLeave: "文件正在上传，离开将会取消现在的上传。"
    };
	var texts = {
        failUpload: "上传失败",
        waitingForResponse: "正在上传...",
        paused: "暂停"
    };
	var deleteFile = {
        forceConfirm: false,
        confirmMessage: "你确定要删除 {filename}吗？",
        deletingStatusText: "正在删除...",
        deletingFailedText: "删除失败"
    };
	var thumbnailsPlaceholders = {
		notAvailablePath : $url('/easyui/plugins/fine-uploader/placeholders/not_available-generic.png'),
		waitingPath:$url('/easyui/plugins/fine-uploader/placeholders/waiting-generic.png')
	};
	var dialogs = {
		showMessage : function(message){
			$.messager.alert('提示',message,'info');
		}
	};
	function loadTemplate(url, id, callback) {
		$.ajax({
			url : url,
			dataType : 'text',
			success : function(html) {
				$('<script />').attr('type', 'text/template').html(html).attr('id', id).appendTo('body');
				callback();
			}
		});
	}
	function ListenersWrapper() {
		var listeners = [];
		Array.prototype.push.apply(listeners,arguments);
		return function(){
			if(listeners.length > 0){
				var args = arguments;
				$.each(listeners,function(i,listener){
					if($.isFunction(listener)){
						listener.apply(this,args);
					}
				});
			}
		}
	}
	function maskitOnStatusChange(opts,oldStat,newStat){
		if(newStat){
			if(newStat.indexOf('ing') > -1){
				$(opts.maskit).maskit();
			}else{
				$(opts.maskit).maskit('unmask');
			}
		}
	}
	$.fn.fineuploader = function(opts) {
		if (typeof opts == 'string') {
			var args = arguments;
			var target  = isExt ? this.find('[uploader-target]') : this;
			if(opts == "clearStoredFiles"){
				var instance = target.data("fineuploader");
				instance.uploader._netUploadedOrQueued=0;
			}
			return _fineuploader.apply(target,args);
		} else {
			return this.each(function() {
				var options = $.fn.fineuploader.parseOptions(this, opts || {});
				var template = options['template'];
				if (template && document.getElementById(template)) {
					_fineuploader.call(getTargetJq(this,options), options);
					if(options.callbacks.onInit){
						options.callbacks.onInit();
					}					
					return;
				}
				template = template || 'default';
				var url = templates[template];
				if (url) {
					var id = 'easyui-fine-uploader-' + template, $jq = getTargetJq(this,options);
					loadTemplate(url, id, function() {
						options['template'] = id;
						_fineuploader.call($jq, options);
						if(options.callbacks.onInit){
							options.callbacks.onInit();
						}
					});
				}
			});
		}
	}
	function getTargetJq(target,options) {
		if(!isExt || options.paste.targetElement != target){
			return $(target);
		}
		var el = $("<div uploader-target='' />").appendTo(target);
		//options.paste.targetElement = $("<div />").appendTo(target)[0];
		return el;
	}
	$.fn.fineuploader.parseOptions = function(target, opts) {
		var options = $.extend(opts, $.parser.parseOptions(target));
		options.messages = $.extend(messages,options.messages);
		if(!options.thumbnails){
			options.thumbnails = {};
		}
		options.text = $.extend(texts,options.text);
		options.deleteFile = $.extend(deleteFile,options.deleteFile);
		options.thumbnails.placeholders = $.extend(thumbnailsPlaceholders,options.thumbnails.placeholders);
		if(!options.showMessage){
			options.showMessage = dialogs.showMessage;
		}
		if(options.request && !options.request.uuidName){
			options.request.uuidName = 'fileId';
		}
		if(options.deleteFile && options.deleteFile.enabled && !options.deleteFile.method){
			options.deleteFile.method = 'POST';
		}
		if(options.maskit){
			if(document.getElementById(options.maskit)){
				options.maskit = '#'+options.maskit;
			}
			function doMaskit(id,oldStat,newStat){
				maskitOnStatusChange(options,oldStat,newStat);
			}
			if(!options.callbacks){
				options.callbacks = {};
			}
			if(!options.callbacks.onStatusChange){
				options.callbacks.onStatusChange = doMaskit;
			}else {
				options.callbacks.onStatusChange = new ListenersWrapper(doMaskit,options.callbacks.onStatusChange);
			}
		}
		//paste.targetElement
		if(options.paste == undefined){
			options.paste = {
				targetElement : target,
				promptForName : true,
				namePromptMessage : '请输入文件名:'
			};
		}
		return options;
	}
	// 注册easyui控件
	$.parser.plugins.push('fineuploader');
})(jQuery);