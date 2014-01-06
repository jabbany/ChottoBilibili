/** Simple Toolkit, Author: Jabbany **/
var Tools = {
    parseTextNumber: function (text) {
        if (/^(\d+)$/g.test(text))
            return parseInt(text.replace(/^0+/, ''));
        var _const = {
            chineseNumbers: ["\u96F6", "\u4E00", "\u4E8C", "\u4E09", "\u56DB",
                    "\u4E94", "\u516D", "\u4E03", "\u516B", "\u4E5D", "\u5341",
                    "\u767E", "\u5343", "\u4E07"
            ],
            litNumbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100, 1000, 10000],
            maru: ["\u2460", "\u2461", "\u2462", "\u2463", "\u2464", "\u2465",
                    "\u2466", "\u2467", "\u2468", "\u2469"
            ]
        };
        for (var i = 0; i < _const.maru.length; i++) {
            text = text.replace(new RegExp(_const.maru[i], "g"), (i + 1) + "");
        }
        if (/^(\d+)$/g.test(text))
            return parseInt(text.replace(/^0+/, ''));
        if (text.length == 1) {
            var i = _const.chineseNumbers.indexOf(text);
            if (i < 0)
                return 0;
            else
                return _const.litNumbers[i];
        } else if (text.length == 2 && text.charAt(0) == "\u5341") {
            return 10 + Tools.parseTextNumber(text.charAt(1));
        } else {
            var literal = 0;
            var matTT = /([\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341\u767E\u5343]+)\u4E07/.exec(text);
            if (matTT != null) {
                text = text.substr(matTT[0].length);
                literal += Tools.parseTextNumber(matTT[1]) * 10000;
            }
            var matT = /([\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341\u767E]+)\u5343/.exec(text);
            if (matT != null)
                literal += Tools.parseTextNumber(matT[1]) * 1000;
            var matH = /([\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341]+)\u767E/.exec(text);
            if (matH != null)
                literal += Tools.parseTextNumber(matH[1]) * 100;
            var matTen = /([\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D]+)\u5341/.exec(text);
            if (matTen != null)
                literal += Tools.parseTextNumber(matTen[1]) * 10;
            var ones = /[\u5341\u96F6]([\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D])$/.exec(text);
            if (ones != null) {
                literal += Tools.parseTextNumber(ones[1]);
            }
            return literal;
        }
    },
    sectionToId: function (table, text) {
        if (table == null)
            return 0;
        var sectLib = table;
        var sectNames = text.split('_');
        for (var k = sectNames.length - 1; k >= 0; k--) {
            if (sectLib[sectNames[k]] != null)
                return sectLib[sectNames[k]];
        }
        if (sectLib[text] != null)
            return sectLib[text];
        return 0;
    }
};
