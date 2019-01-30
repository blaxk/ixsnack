if ( $.fn && typeof $.fn.extend === 'function' ) {
	$.fn.extend({
		ixOptions: function ( val1 ) {
			//setter
			if ( $B.object.is(val1) ) {
				return this.each( function ( idx, el ) {
					var optionData = $( el ).attr( 'data-ix-options' ),
						value = ( optionData )? ixSnack.objToOptions( optionData, val1 ) : ixSnack.objToOptions( '', val1 );

					$( el ).attr( 'data-ix-options', value ).addClass( 'ix-options-apply' );
				});
			} else {
				var options = ixSnack.parseOptions( this.attr('data-ix-options') );

				if ( $B.string.is(val1) ) {
					var option = options[$B.string.camelCase(val1)];
					if ( option ) {
						if ( $B.array.is(option) ) {
							options = [
								( option[0].unit )? option[0].value + option[0].unit : option[0].value,
								( option[1].unit )? option[1].value + option[1].unit : option[1].value
							];
						} else {
							options = ( option.unit )? option.value + option.unit : option.value;
						}
					} else {
						options = undefined;
					}
				}

				return options
			}
		},

		ixSlideMax: function ( val1, val2, val3 ) {
			return ixSnack.setPlugin( this, 'slide-max', ixSnack.SlideMax, val1, val2, val3 );
		},

		ixSlideLite: function ( val1, val2, val3 ) {
			return ixSnack.setPlugin( this, 'slide-lite', ixSnack.SlideLite, val1, val2, val3 );
		},

		ixOverlayList: function ( val1, val2, val3 ) {
			return ixSnack.setPlugin( this, 'overlay-list', ixSnack.OverlayList, val1, val2, val3 );
		},

		ixRangeSlider: function ( val1, val2, val3 ) {
			return ixSnack.setPlugin( this, 'range-slider', ixSnack.RangeSlider, val1, val2, val3 );
		},

		ixSlider: function ( val1, val2, val3 ) {
			return ixSnack.setPlugin( this, 'slider', ixSnack.Slider, val1, val2, val3 );
		},

		ixRatioSize: function ( value ) {
			if ( value && $B.object.is(value) ) this.ixOptions( value );

			return this.each( function ( idx, el ) {
				var $el = $( el ),
					options = ixSnack.parseOptions( $el.attr('data-ix-options') ),
					axis = ( options.axis )? options.axis.value : 'horizontal',
					controlType = ( options.controlType )? options.controlType.value : 'style',
					width, height, apply = false;

				if ( options.ratio ) {
					if ( axis === 'horizontal' ) {
						width = $el.width();
						height = width * ( options.ratio[1].value / options.ratio[0].value );

						if ( width ) {
							if ( controlType === 'style' || controlType === 'all' ) $el.css( 'height', height + 'px' );
							if ( controlType === 'attr' || controlType === 'all' ) $el.attr( 'height', height );
							apply = true;
						}
					} else {
						height = $el.height();
						width = height * ( options.ratio[0].value / options.ratio[1].value );

						if ( height ) {
							if ( controlType === 'style' || controlType === 'all' ) $el.css( 'width', width + 'px' );
							if ( controlType === 'attr' || controlType === 'all' ) $el.attr( 'width', width );
							apply = true;
						}
					}

					if ( apply ) $el.addClass( 'ix-ratio-size-apply' );
				}
			});
		}
	});
}