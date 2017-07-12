/**
 * Thumbnail, Next, Prev Controller 관리
 * Event : index, next, prev
 * @constructor
 * @param   {jQueryObject}    $target
 * @param   {Object}
 */
ixSnack.ThumbController = $B.Class.extend({
    initialize: function ( $target, options ) {
        this._$controller = $target.find( '> .ix-controller' );
        this._$prevBtn = this._$controller.find( '.ix-btn-prev' );
        this._$nextBtn = this._$controller.find( '.ix-btn-next' );
        this._$thumbArea = this._$controller.find( '.ix-thumbs' );

        this._options = options || {};
        this._isPrevButtonTag = this._isButtonTag( this._$prevBtn );
        this._isNextButtonTag = this._isButtonTag( this._$nextBtn );
        this._thumbHtml = '';
        this._isDisabled = false;
        this._isBlock = false;
        this._selectIdx = 0;

        this._setThumbs();
        this._setEvents();
        this._selectThumb( 0 );

        if ( this._options.originLength <= this._options.viewLength ) {
            this._$prevBtn.addClass( 'disabled' ).attr( 'aria-disabled', true );
            this._$nextBtn.addClass( 'disabled' ).attr( 'aria-disabled', true );
            this._$controller.addClass( 'disabled' );
            this._$thumbs.find( '.ix-btn' ).attr( 'aria-disabled', true );
        }
    },

    // =============== Public Methods =============== //

    setIndex: function ( originIdx, idx ) {
        this._selectThumb( originIdx );
        this._setArrowState( idx );
        return this;
    },

    enable: function () {
        this._isDisabled = false;
        return this;
    },

    disable: function () {
        this._isDisabled = true;
        return this;
    },

    block: function ( state ) {
        if ( typeof state === 'boolean' ) {
            this._isBlock = state;
            return this;
        } else {
            return this._isBlock;
        }
    },

    //등록된 이벤트와 설정 삭제
    clear: function () {
        this._$prevBtn.off( 'click', this._directionHandler );
        this._$nextBtn.off( 'click', this._directionHandler );
        this._$thumbs.off( 'click', '.ix-btn', this._thumbHandler );
        this._$thumbArea.html( this._thumbHtml );
        this._$controller.removeClass( 'disabled' );
        this._$prevBtn.removeClass( 'disabled' ).removeAttr( 'aria-disabled' );
        this._$nextBtn.removeClass( 'disabled' ).removeAttr( 'aria-disabled' );
        this._removeWaiAria();
    },

    // =============== Private Methods =============== //

    _selectThumb: function ( idx ) {
        var thumbIdx = ( this._options.paging )? Math.ceil( idx / this._options.viewLength ) : idx;
        this._$thumbs.removeClass( 'active' ).attr( 'aria-selected', false ).eq( thumbIdx ).addClass( 'active' ).attr( 'aria-selected', true );
        this._selectIdx = idx;
    },

    _setEvents: function () {
        this._directionHandler = $B.bind(function (e) {
            e.preventDefault();
            if ( $(e.currentTarget).hasClass('disabled') || this._isDisabled || this._isBlock ) return;

            if ( $(e.currentTarget).hasClass('ix-btn-prev') ) {
                this._dispatch( 'prev' );
            } else {
                this._dispatch( 'next' );
            }
        }, this);

        this._thumbHandler = $B.bind( function (e) {
            e.preventDefault();
            if ( this._isDisabled || this._isBlock ) return;
            this._dispatch( 'index', $(e.currentTarget).closest('.ix-thumb' ).attr('data-idx') );
        }, this);

        this._$prevBtn.on( 'click', this._directionHandler );
        this._$nextBtn.on( 'click', this._directionHandler );
        this._$thumbs.on( 'click', '.ix-btn', this._thumbHandler );
    },

    //좌우화살표 상태 처리
    _setArrowState: function ( index ) {
        if ( this._options.originLength > this._options.viewLength && !this._options.loop ) {
            //prev
            if ( index > 0 ) {
                this._$prevBtn.removeClass( 'disabled' ).attr( 'aria-disabled', false );
                if ( this._isPrevButtonTag ) this._$prevBtn.attr( 'disabled', false ).prop( 'disabled', false );
            } else {
                this._$prevBtn.addClass( 'disabled' ).attr( 'aria-disabled', true );
                if ( this._isPrevButtonTag ) this._$prevBtn.attr( 'disabled', true ).prop( 'disabled', true );
            }

            //next
            if ( index < (this._options.totalLength - this._options.viewLength) ) {
                this._$nextBtn.removeClass( 'disabled' ).attr( 'aria-disabled', false );
                if ( this._isNextButtonTag ) this._$nextBtn.attr( 'disabled', false ).prop( 'disabled', false );
            } else {
                this._$nextBtn.addClass( 'disabled' ).attr( 'aria-disabled', true );
                if ( this._isNextButtonTag ) this._$nextBtn.attr( 'disabled', true ).prop( 'disabled', true );
            }
        }
    },

    _setThumbs: function () {
        var result = '',
            thumbLength = ( this._options.paging )? Math.ceil( this._options.originLength / this._options.viewLength ) : this._options.originLength;

        this._thumbHtml = this._$thumbArea.html();

        var $div = $( '<div>' ).append( this._$thumbArea.find('> .ix-thumb') ),
            thumbHtml = $div.html();

        for ( var i = 0; i < thumbLength; ++i ) {
            result += thumbHtml.replace( /<!--[-\s]*ix-index[\s-]*-->/gim, i + 1 );
        }

        this._$thumbArea.html( result );
        this._$thumbs = this._$thumbArea.find( '> .ix-thumb' ).each( $B.bind(function ( idx, el ) {
            var thumbIdx = ( this._options.paging )? idx * this._options.viewLength : idx;
            $( el ).attr( 'data-idx', thumbIdx );
        }, this));
    },

    _isButtonTag: function ( $el ) {
        var result = false;

        if ( $el.get(0) ) {
            var nodeName = $el.get(0).nodeName;

            if ( /input/i.test(nodeName) ) {
                result = /button/i.test( $el.attr('type') );
            } else {
                result = /button/i.test( nodeName );
            }
        }

        return result;
    },

    _removeWaiAria: function () {
        this._$thumbs.removeAttr( 'aria-selected' );
    },

    _dispatch: function ( type, idx ) {
        this._selectIdx = Number( idx );
        this.dispatch( type, {index: this._selectIdx} );
    }
}, 'ixSnack.ThumbController');