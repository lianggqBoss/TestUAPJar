var Base64 = (function() {
	var _map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	function convert(source) {
		source = unescape(encodeURIComponent(source));
		var len = source.length;
		// Convert
		var words = [];
		for (var i = 0; i < len; i++) {
			words[i >>> 2] |= (source.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
		}
		return {
			length : len,
			words : words
		}
	}

	var b64encode = function(source) {
		source = convert(source);
        // Convert
		var map = _map;
		var words = source.words;
		var sigBytes = source.length;
        var base64Chars = [];
        for (var i = 0; i < sigBytes; i += 3) {
            var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
            var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
            var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

            var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

            for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
                base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
            }
        }

        // Add padding
        var paddingChar = map.charAt(64);
        if (paddingChar) {
            while (base64Chars.length % 4) {
                base64Chars.push(paddingChar);
            }
        }

        return base64Chars.join('');		
	}

	return {
		encode : b64encode
	};

})();