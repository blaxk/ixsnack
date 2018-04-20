/**
 * 리스트형 Index Data 관리
 * @constructor
 * @param {Object}      options
 * @param {Object}      dispatches  전달 받을 이벤트들
 *      - {Function}    onChange    index가 변경되었으시 callback {type:'change', index, endpoint}
 *      - {Function}    onCorrect   rangeIndex 보정이 발생시 callback {type:'correct', index, endpoint}
 */
ixSnack.ListIndexManager = $B.Class.extend({
    initialize: function ( options, dispatches ) {
        this._options = options || {};
        this._dispatches = ( typeof dispatches === 'object' ) ? dispatches : {};
        this._selectIdx = 0;
        this._originStartIdx = 0;
        this._lastCloneStartIdx = 0;
        this._originLength = this._options.originLength;

        if ( this._options.loop && this._originLength > this._options.viewLength ) {
            this._originStartIdx = this._options.firstCloneLength;
            this._lastCloneStartIdx = this._originStartIdx + this._originLength;
        }

        var initIndex = this._originStartIdx;

        if ( this._options.defaultIndex ) {
            if ( this._options.loop ) {
                this.correct( this._options.defaultIndex + this._originStartIdx );
                initIndex = this._selectIdx;
            } else {
                initIndex = this._getCorrectIndex( this._options.defaultIndex );
            }
        }

        this._dispatch( 'init', initIndex );
    },

    // =============== Public Methods =============== //

    prev: function ( rangeLength, isInput ) {
        if ( this._originLength <= this._options.viewLength ) return;
        var moveLength = rangeLength || this._options.moveLength;
        this._setNextIndex( -moveLength, isInput );
    },

    next: function ( rangeLength, isInput ) {
        if ( this._originLength <= this._options.viewLength ) return;
        var moveLength = rangeLength || this._options.moveLength;
        this._setNextIndex( moveLength, isInput );
    },

    //이동이후 보정할게 있을때만 보정.
    correct: function ( selectIdx ) {
        if ( !this._options.loop || this._originLength <= this._options.viewLength ) return;
        var correctType = this._getCorrectType( selectIdx );

        if ( correctType === 'next' ) {
            this._dispatch( 'correct', this._originStartIdx + (selectIdx - this._lastCloneStartIdx) );
        } else if ( correctType === 'prev' ) {
            this._dispatch( 'correct', this._lastCloneStartIdx - (this._originStartIdx - selectIdx) );
        } else {
            this._selectIdx = selectIdx;
        }
    },

    // =============== Private Methods =============== //

    _setNextIndex: function ( rangeLength, isInput ) {
        var nextSelectIdx = this._selectIdx + rangeLength;

        if ( this._options.loop ) {
            //next, prev, changeIndex 를 이용하여 이동시킬때 보정을 거친후 이동
            if ( isInput ) {
				var nextRangeIdx = ( rangeLength > 0 )? nextSelectIdx + this._options.viewLength : nextSelectIdx - this._options.viewLength;

                if ( nextRangeIdx < 1 ) {
                    this._dispatch( 'correct', this._lastCloneStartIdx - (this._originStartIdx - this._selectIdx) );
                    nextSelectIdx = this._selectIdx + rangeLength;
                } else if ( nextRangeIdx > this._options.totalLength - 1 ) {
                    this._dispatch( 'correct', this._originStartIdx + (this._selectIdx - this._lastCloneStartIdx) );
                    nextSelectIdx = this._selectIdx + rangeLength;
                }
            }
        } else {
            nextSelectIdx = this._getCorrectIndex( nextSelectIdx );
        }

        this._dispatch( 'change', nextSelectIdx );
    },

    //loop:false 일때 최소 최대치 보정값 반환
    _getCorrectIndex: function ( selectIdx ) {
        if ( selectIdx < 0 ) {
            selectIdx = 0;
        } else if ( selectIdx > this._originLength - this._options.viewLength ) {
            var rest = this._originLength % this._options.viewLength;

            //paging:true 면 마지막 index 보정
            if ( this._options.paging && rest ) {
                var totalPage = Math.ceil( this._originLength / this._options.viewLength ) - 1,
                    currentPage = Math.ceil( selectIdx / this._options.viewLength );

                if ( currentPage > totalPage ) {
                    selectIdx = this._originLength - rest;
                }
            } else {
                selectIdx = this._originLength - this._options.viewLength;
            }
        }

        return selectIdx;
    },

    //loop:true 일때 보정타입 반환
    _getCorrectType: function ( selectIdx ) {
        var result = '',
            min = ( this._options.datumPoint )? 1 : 0;

        if ( selectIdx + (this._options.viewLength * 2) > this._options.totalLength ) {
            result = 'next';
        } else if ( selectIdx - this._options.viewLength < min ) {
            result = 'prev';
        }

        return result;
    },

    _getEndpoint: function ( selectIdx ) {
        var result = false;

        if ( !this._options.loop ) {
            if ( this._options.paging ) {
                var totalPage = Math.ceil( this._originLength / this._options.viewLength ) - 1,
                    currentPage = Math.ceil( selectIdx / this._options.viewLength );

                if ( currentPage >= totalPage ) result = true;
            } else {
                if ( selectIdx >= this._originLength - this._options.viewLength ) result = true;
            }
        }

        return result;
    },

    _dispatch: function ( type, idx ) {
        this._selectIdx = idx;

        var eventName = 'on' + $B.string.capitalize( type );
        if ( this._dispatches[eventName] ) this._dispatches[eventName].call( this, {type: type, index: idx, endpoint: this._getEndpoint(idx)} );
    }

}, 'ixSnack.ListIndexManager');