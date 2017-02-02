'use strict';
angular
	.module('softvApp')
	.controller('FacturacionVentasCtrl', function($uibModal, $state, $rootScope, cajasFactory, ngNotify) {

		function initialData() {
			getVendedores();
		}

		function openEdoCuenta() {
			vm.animationsEnabled = true;
			var modalInstance = $uibModal.open({
				animation: vm.animationsEnabled,
				ariaLabelledBy: 'modal-title',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'views/facturacion/modalEdoCuenta.html',
				controller: 'ModalEdoCuentaCtrl',
				controllerAs: 'ctrl',
				backdrop: 'static',
				keyboard: false,
				size: 'lg',
				windowClass: 'app-modal-window',
				resolve: {
					contrato: function() {
						return vm.Cliente.Contrato;
					}
				}
			});
		}

		$rootScope.$on('getVendedores', function() {
			getVendedores();
		});

		function getVendedores() {
			cajasFactory.dameVendedores().then(function(data) {
				data.GetVendedoresLListResult.unshift({
					'Nombre': '----------------',
					'Clv_Vendedor': 0
				});
				vm.vendedores = data.GetVendedoresLListResult;
				vm.selectedVendedor = data.GetVendedoresLListResult[0];
			});
		}

		function changeVendedor() {
			if (vm.selectedVendedor.Clv_Vendedor == 0) {
				ngNotify.set('Selecciona un vendedor.', 'error');
			} else {
				cajasFactory.ultimoFolio(vm.selectedVendedor.Clv_Vendedor).then(function(data) {
					data.GetUltimoSerieYFolioListResult.unshift({
						'SERIE': '----------------',
						'ULTIMOFOLIO_USADO': 0
					});
					vm.series = data.GetUltimoSerieYFolioListResult;
					vm.selectedSerie = data.GetUltimoSerieYFolioListResult[0];
					vm.folios = '';
				});
			}
		}

		function changeSerie() {
			if (vm.selectedSerie.ULTIMOFOLIO_USADO == 0) {
				ngNotify.set('Selecciona una serie.', 'error');
			} else {
				cajasFactory.folioDisponible(vm.selectedVendedor.Clv_Vendedor, vm.selectedSerie.SERIE).then(function(data) {
					if (data.GetFolioDisponibleListResult.length > 0) {
						data.GetFolioDisponibleListResult.unshift({
							'Folio': '----------------',
						});
						vm.folios = data.GetFolioDisponibleListResult;
						vm.selectedFolio = data.GetFolioDisponibleListResult[0];
					}
				});
			}
		}

		function openDeleteList() {
			if (vm.selectAparato == undefined) {
				ngNotify.set('Selecciona un concepto.', 'error');
			} else if (vm.selectAparato.CLAVE == 1 || vm.selectAparato.CLAVE == 3) {
				if (vm.selectAparato.Pagos_Adelantados != 'Ext. Adicionales') {
					if (vm.selectAparato.CLAVE == 1) {
						ngNotify.set('No se puede quitar la Contratació.', 'error');
					} else if (vm.selectAparato.CLAVE == 2) {
						ngNotify.set('No se puede quitar la Reconexión.', 'error');
					}
				}
			} else {
				if (vm.selectAparato != '') {
					cajasFactory.quitarDetalle(vm.Cliente.Contrato, vm.session, vm.selectAparato.CLV_DETALLE, vm.Suscriptor.Clv_TipoCliente).then(function(data) {
						if (data.GetQuitarDetalleListResult[0].Error == 0) {
							cajasFactory.dameDetallePago(vm.session).then(function(detallePago) {
								vm.detallePago = detallePago.GetDameDetalleListResult;
							});
							cajasFactory.dameSumaPago(vm.session).then(function(sumaPago) {
								vm.sumaPagos = sumaPago.GetSumaDetalleListResult;
							});
							cajasFactory.addBitacora(vm.Cliente.Contrato, vm.selectAparato.Pagos_Adelantado).then(function(data) {});
							vm.selectAparato = undefined;
						} else {
							ngNotify.set(data.GetQuitarDetalleListResult[0].Msg, 'error');
						}
					});
				} else {
					ngNotify.set('Seleccione un concepto válido', 'error');
				}
			}
		}

		function adelantaPagos(item) {
			cajasFactory.puedoAdelantarPago(vm.session).then(function(data) {
				vm.errPag = data.GetDeepAdelantarResult.Error;
				if (vm.errPag == 0) {
					cajasFactory.checaAdelantarPagos(vm.Cliente.Contrato).then(function(dataCheca) {
						vm.errChec = dataCheca.GetDeepChecaAdelantarPagosDifResult.Error;
						if (vm.errChec == 0) {
							var items = {
								Concepto: item,
								Session: vm.session,
								Contrato: vm.Cliente.Contrato,
								Suscriptor: vm.Suscriptor
							};
							vm.animationsEnabled = true;
							var modalInstance = $uibModal.open({
								animation: vm.animationsEnabled,
								ariaLabelledBy: 'modal-title',
								ariaDescribedBy: 'modal-body',
								templateUrl: 'views/facturacion/modalAdelantaPago.html',
								controller: 'ModalAdelantaPagoCtrl',
								controllerAs: 'ctrl',
								backdrop: 'static',
								keyboard: false,
								class: 'modal-backdrop fade',
								size: 'sm',
								resolve: {
									items: function() {
										return items;
									}
								}
							});
						} else {
							ngNotify.set(dataCheca.GetDeepChecaAdelantarPagosDifResult.Msg, 'info');
						}
					});
				} else {
					ngNotify.set(data.GetDeepAdelantarResult.Msg, 'info');
				}
			});
		}

		function guardaconcepto(item, index) {
			for (var i = 0; i < vm.detallePago.length; i++) {
				vm.detallePago[i].isChecked = false;
			}
			vm.detallePago[index].isChecked = true;
			vm.selectAparato = item;
		}

		function openSuspencion() {
			cajasFactory.suspencionTemporal(vm.Cliente.Contrato, vm.session).then(function(data) {
				vm.mostrarSuspencion = true;
				if (data.GetSuspencionTemporalListResult.length == 0) {
					cajasFactory.dameDetallePago(vm.session).then(function(detallePago) {
						vm.detallePago = detallePago.GetDameDetalleListResult;
					});
					cajasFactory.dameSumaPago(vm.session).then(function(sumaPago) {
						vm.sumaPagos = sumaPago.GetSumaDetalleListResult;
					});
				} else {
					ngNotify.set(data.GetSuspencionTemporalListResult[0].Meg, 'info');
				}
			});
		}

		function openHistorial() {
			vm.animationsEnabled = true;
			var modalInstance = $uibModal.open({
				animation: vm.animationsEnabled,
				ariaLabelledBy: 'modal-title',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'views/facturacion/modalHistorial.html',
				controller: 'ModalHistorialCtrl',
				controllerAs: 'ctrl',
				backdrop: 'static',
				keyboard: false,
				class: 'modal-backdrop fade',
				size: 'sm',
				resolve: {
					contrato: function() {
						return vm.Cliente.Contrato;
					}
				}
			});
		}

		function openInformation() {
			vm.animationsEnabled = true;
			var modalInstance = $uibModal.open({
				animation: vm.animationsEnabled,
				ariaLabelledBy: 'modal-title',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'views/facturacion/modalInformation.html',
				controller: 'ModalInformationCtrl',
				controllerAs: 'ctrl',
				backdrop: 'static',
				keyboard: false,
				size: 'sm',
				resolve: {
					contrato: function() {
						return vm.Cliente.Contrato;
					}
				}
			});
		}

		function openAddList() {
			var items = {
				Contrato: vm.Cliente.Contrato,
				Session: vm.session,
				Tipo: vm.Suscriptor.Clv_TipoCliente
			};
			vm.animationsEnabled = true;
			var modalInstance = $uibModal.open({
				animation: vm.animationsEnabled,
				ariaLabelledBy: 'modal-title',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'views/facturacion/modalAddList.html',
				controller: 'ModalAddListCtrl',
				controllerAs: 'ctrl',
				backdrop: 'static',
				keyboard: false,
				size: 'sm',
				resolve: {
					items: function() {
						return items;
					}
				}
			});
		}

		function openPay(tipo) {
			if (vm.selectedVendedor.Clv_Vendedor == 0 || vm.selectedVendedor.Clv_Vendedor == '' || vm.selectedVendedor.Clv_Vendedor == undefined) {
				ngNotify.set('Selecciona un vendedor.', 'error');
			} else if (vm.selectedSerie.ULTIMOFOLIO_USADO == 0 || vm.selectedSerie.ULTIMOFOLIO_USADO == '' || vm.selectedSerie.ULTIMOFOLIO_USADO == undefined) {
				ngNotify.set('Selecciona una serie.', 'error');
			} else {
				if (vm.selectedFolio.Folio == 0 || vm.selectedFolio.Folio == '' || vm.selectedFolio.Folio == undefined || vm.selectedFolio.Folio == '----------------') {
					ngNotify.set('La caja no tiene asignados folios para esta plaza.', 'error');
				} else {
					cajasFactory.dameSucursalCompa(vm.Cliente.Contrato).then(function(data) {
						if (data.GetDeepDameRelSucursalCompaResult.Id == 0) {
							ngNotify.set('La caja no tiene asignados folios para esta plaza.', 'error');
						} else {
							cajasFactory.dimeSiYaFact(vm.Cliente.Contrato).then(function(dataDime) {
								if (dataDime.GetDeepDimeSiYaGrabeFacResult.Id == 0) {
									cajasFactory.sumaTotalDetalle(vm.session).then(function(sumaTotal) {
										var items = {
											monto: sumaTotal.GetDeepSumaTotalDetalleResult.Monto,
											IdSession: vm.session,
											Contrato: vm.Cliente.Contrato,
											Tipo: tipo,
											Vendedor: vm.selectedVendedor.Clv_Vendedor,
											Serie: vm.selectedSerie.SERIE,
											Folio: vm.selectedFolio.Folio
										};
										vm.animationsEnabled = true;
										var modalInstance = $uibModal.open({
											animation: vm.animationsEnabled,
											ariaLabelledBy: 'modal-title',
											ariaDescribedBy: 'modal-body',
											templateUrl: 'views/facturacion/modalPagar.html',
											controller: 'ModalPagarCtrl',
											controllerAs: 'ctrl',
											backdrop: 'static',
											keyboard: false,
											size: 'md',
											resolve: {
												items: function() {
													return items;
												}
											}
										});
									});
								} else {
									cajasFactory.sumaTotalDetalle(vm.session).then(function(sumaTotal) {
										var items = {
											monto: sumaTotal.GetDeepSumaTotalDetalleResult.Monto,
											IdSession: vm.session,
											Contrato: vm.Cliente.Contrato,
											Tipo: tipo,
											Vendedor: vm.selectedVendedor.Clv_Vendedor,
											Serie: vm.selectedSerie.SERIE,
											Folio: vm.selectedFolio.Folio
										};
										vm.animationsEnabled = true;
										var modalInstance = $uibModal.open({
											animation: vm.animationsEnabled,
											ariaLabelledBy: 'modal-title',
											ariaDescribedBy: 'modal-body',
											templateUrl: 'views/facturacion/modalYaPago.html',
											controller: 'ModalYaPagoCtrl',
											controllerAs: 'ctrl',
											backdrop: 'static',
											keyboard: false,
											size: 'md',
											resolve: {
												items: function() {
													return items;
												}
											}
										});
									});
								}
							});
						}
					});
				}
			}
		}

		$rootScope.$on('ocultarPagar', function() {
			vm.muestraCliente = false;
		});

		function openReturn() {
			if (vm.selectAparato == undefined) {
				ngNotify.set('Selecciona un concepto.', 'error');
			} else if (vm.selectAparato.CLAVE != 2) {
				ngNotify.set('Solo se puede cobrar adeudos a conceptos de mensualidad.', 'error');
			} else {
				var items = {
					CLV_DETALLE: vm.selectAparato.CLV_DETALLE,
					Contrato: vm.Cliente.Contrato,
					Session: vm.session
				};
				vm.animationsEnabled = true;
				var modalInstance = $uibModal.open({
					animation: vm.animationsEnabled,
					ariaLabelledBy: 'modal-title',
					ariaDescribedBy: 'modal-body',
					templateUrl: 'views/facturacion/modalRegresar.html',
					controller: 'ModalRegresarCtrl',
					controllerAs: 'ctrl',
					backdrop: 'static',
					keyboard: false,
					size: 'lg',
					resolve: {
						items: function() {
							return items;
						}
					}
				});
			}

		}

		function openClabe() {
			cajasFactory.dameClabe(vm.Cliente.Contrato).then(function(data) {
				if (data.GetBotonClabeListResult[0].YaTiene == 0) {
					ngNotify.set('El contrato no cuenta con Cuenta Clabe asignada.', 'info');
				} else {
					vm.animationsEnabled = true;
					var modalInstance = $uibModal.open({
						animation: vm.animationsEnabled,
						ariaLabelledBy: 'modal-title',
						ariaDescribedBy: 'modal-body',
						templateUrl: 'views/facturacion/modalCalbe.html',
						controller: 'ModalClabeCtrl',
						controllerAs: 'ctrl',
						backdrop: 'static',
						keyboard: false,
						size: 'sm',
						resolve: {
							clabe: function() {
								return data.GetBotonClabeListResult[0].Clabe;
							}
						}
					});
				}
			});

		}

		function buscarPorContrato() {
			PNotify.removeAll();
			$('.buscarContrato').collapse('hide');
			vm.mostrarSuspencion = false;
			reset();
			var contrato = vm.data.contrato;
			cajasFactory.validarContrato(vm.data.contrato).then(function(datacontrato) {
				if (datacontrato.Getsp_dameContratoCompaniaAdicListResult[0].Contrato > 0) {
					cajasFactory.buscarContrato(contrato).then(function(data) {
						if (data.GetBusCliPorContrato_FacListResult.length > 0) {
							vm.Cliente = data.GetBusCliPorContrato_FacListResult[0];
							cajasFactory.dameSession(vm.Cliente.Contrato).then(function(session) {
								vm.session = session.GetDeepDameClv_SessionResult.IdSession;
								cajasFactory.preguntaCajas(vm.Cliente.Contrato, 0).then(function(op1) {
									if (op1.GetDeepuspHaz_PreguntaResult.Pregunta != null) {
										abrirModalPregunta(0, op1.GetDeepuspHaz_PreguntaResult.Pregunta, op1.GetDeepuspHaz_PreguntaResult.MesesAdelantados);
									}
								});
								cajasFactory.preguntaCajas(vm.Cliente.Contrato, 2).then(function(op1) {
									if (op1.GetDeepuspHaz_PreguntaResult.Pregunta != null) {
										abrirModalPregunta(2, op1.GetDeepuspHaz_PreguntaResult.Pregunta, op1.GetDeepuspHaz_PreguntaResult.MesesAdelantados);
									}
								});
								cajasFactory.preguntaCajas(vm.Cliente.Contrato, 3).then(function(op1) {
									if (op1.GetDeepuspHaz_PreguntaResult.Pregunta != null) {
										abrirModalPregunta(3, op1.GetDeepuspHaz_PreguntaResult.Pregunta, op1.GetDeepuspHaz_PreguntaResult.MesesAdelantados);
									}
								});
								cajasFactory.preguntaCajas(vm.Cliente.Contrato, 900).then(function(op1) {
									if (op1.GetDeepuspHaz_PreguntaResult.Pregunta != null) {
										abrirModalPregunta(900, op1.GetDeepuspHaz_PreguntaResult.Pregunta, op1.GetDeepuspHaz_PreguntaResult.MesesAdelantados);
									}
								});
								cajasFactory.checaRetiro(vm.Cliente.Contrato).then(function(retiro) {
									if (retiro.GetChecaOrdenRetiroListResult[0].Resultado > 0) {
										new PNotify({
											title: 'Aviso',
											text: retiro.GetChecaOrdenRetiroListResult[0].Msg,
											hide: false
										});
									}
								});
								cajasFactory.getObservaciones(vm.Cliente.Contrato).then(function(observa) {
									if (observa.GetDeepConRelClienteObsResult.Obs) {
										new PNotify({
											title: 'Observaciones',
											type: 'info',
											text: observa.GetDeepConRelClienteObsResult.Obs,
											hide: false
										});
									}
								});
								if (session.GetDeepDameClv_SessionResult.Error == 0) {
									reloadTables();
									vm.mostrarSuspencion = false;
									vm.color = '#ffffff'
									vm.colorServicios = '#E2EBEA';
								} else {
									reloadTables();
									vm.mostrarSuspencion = true;
									vm.color = '#D6D9D9';
									vm.colorServicios = '#B8BABA';
									ngNotify.set(session.GetDeepDameClv_SessionResult.Msg, {
										type: 'warn',
										sticky: true
									});
								}
							});
							cajasFactory.serviciosCliente(vm.Cliente.Contrato).then(function(servicios) {
								var array = $.map(servicios, function(value, index) {
									return [value];
								});
								vm.servicios = array[0];
							});
							cajasFactory.dameSuscriptor(vm.Cliente.Contrato).then(function(suscriptor) {
								vm.Suscriptor = suscriptor.GetDameTiposClientesListResult[0];
							});
							cajasFactory.damePeriodoCliente(vm.Cliente.Contrato).then(function(dataPeriodo) {
								vm.periodo = dataPeriodo.GetPeriodoClienteResult[0].Periodo;
								if (dataPeriodo.GetPeriodoClienteResult[0].Resultado == 0) {
									vm.showFiscales = false;
								} else {
									vm.showFiscales = true;
								}
							});
							vm.muestraCliente = true;
						} else {
							ngNotify.set('No se encontro ningun cliente con ese número de contrato.', 'error');
							reset();
						}
					});
				} else {
					ngNotify.set('El usuario no tiene permisos para ver a este cliente ó el contrato no existe.', 'error');
					reset();
				}
			});
			resetBusquedas();
			$('.datosCliente').collapse('show');
			$('.conceptosCliente').collapse('show');
		}

		function abrirModalPregunta(op, pregunta, meses) {
			var items = {
				op: op,
				pregunta: pregunta,
				session: vm.session,
				contrato: vm.Cliente.Contrato,
				meses: meses
			}
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: 'modal-title',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'views/facturacion/modalPregunta.html',
				controller: 'ModalPreguntaCtrl',
				controllerAs: 'ctrl',
				backdrop: 'static',
				keyboard: false,
				class: 'modal-backdrop fade',
				size: 'md',
				resolve: {
					items: function() {
						return items;
					}
				}
			});
		}

		function buscarPorNombre() {
			PNotify.removeAll();
			vm.mostrarSuspencion = false;
			reset();
			$('.buscarContrato').collapse('hide');
			vm.muestraClientesTable = true;
			vm.isCollapsed = !vm.isCollapsed;
			cajasFactory.buscarPorNombre(vm.data.nombre, vm.data.apaterno, vm.data.amaterno).then(function(data) {
				if (data.GetuspBusCliPorContratoSeparadoListResult.length == 0) {
					ngNotify.set('No se encontro ninguna coincidencia.', 'error');
					reset();
				} else {
					vm.todosClientes = data.GetuspBusCliPorContratoSeparadoListResult;
				}
			});
			resetBusquedas();
		}

		function selectCliente(x) {
			PNotify.removeAll();
			reset();
			cajasFactory.validarContrato(x).then(function(datacontrato) {
				if (datacontrato.Getsp_dameContratoCompaniaAdicListResult[0].Contrato > 0) {
					cajasFactory.buscarContrato(x).then(function(data) {
						if (data.GetBusCliPorContrato_FacListResult.length > 0) {
							vm.Cliente = data.GetBusCliPorContrato_FacListResult[0];
							cajasFactory.dameSession(vm.Cliente.Contrato).then(function(session) {
								vm.session = session.GetDeepDameClv_SessionResult.IdSession;
								cajasFactory.preguntaCajas(vm.Cliente.Contrato, 0).then(function(op1) {
									if (op1.GetDeepuspHaz_PreguntaResult.Pregunta != null) {
										abrirModalPregunta(0, op1.GetDeepuspHaz_PreguntaResult.Pregunta, op1.GetDeepuspHaz_PreguntaResult.MesesAdelantados);
									}
								});
								cajasFactory.preguntaCajas(vm.Cliente.Contrato, 2).then(function(op1) {
									if (op1.GetDeepuspHaz_PreguntaResult.Pregunta != null) {
										abrirModalPregunta(2, op1.GetDeepuspHaz_PreguntaResult.Pregunta, op1.GetDeepuspHaz_PreguntaResult.MesesAdelantados);
									}
								});
								cajasFactory.preguntaCajas(vm.Cliente.Contrato, 3).then(function(op1) {
									if (op1.GetDeepuspHaz_PreguntaResult.Pregunta != null) {
										abrirModalPregunta(3, op1.GetDeepuspHaz_PreguntaResult.Pregunta, op1.GetDeepuspHaz_PreguntaResult.MesesAdelantados);
									}
								});
								cajasFactory.preguntaCajas(vm.Cliente.Contrato, 900).then(function(op1) {
									if (op1.GetDeepuspHaz_PreguntaResult.Pregunta != null) {
										abrirModalPregunta(900, op1.GetDeepuspHaz_PreguntaResult.Pregunta, op1.GetDeepuspHaz_PreguntaResult.MesesAdelantados);
									}
								});
								cajasFactory.checaRetiro(vm.Cliente.Contrato).then(function(retiro) {
									if (retiro.GetChecaOrdenRetiroListResult[0].Resultado > 0) {
										new PNotify({
											title: 'Aviso',
											text: retiro.GetChecaOrdenRetiroListResult[0].Msg,
											hide: false
										});
									}
								});
								if (session.GetDeepDameClv_SessionResult.Error == 0) {
									reloadTables();
									vm.mostrarSuspencion = false;
									vm.color = '#ffffff'
									vm.colorServicios = '#E2EBEA';
								} else {
									reloadTables();
									vm.mostrarSuspencion = true;
									vm.color = '#D6D9D9';
									vm.colorServicios = '#B8BABA';
									ngNotify.set(session.GetDeepDameClv_SessionResult.Msg, {
										type: 'warn',
										sticky: true
									});
								}
							});
							cajasFactory.serviciosCliente(vm.Cliente.Contrato).then(function(servicios) {
								var array = $.map(servicios, function(value, index) {
									return [value];
								});
								vm.servicios = array[0];
							});
							cajasFactory.dameSuscriptor(vm.Cliente.Contrato).then(function(suscriptor) {
								vm.Suscriptor = suscriptor.GetDameTiposClientesListResult[0];
							});
							cajasFactory.damePeriodoCliente(vm.Cliente.Contrato).then(function(dataPeriodo) {
								vm.periodo = dataPeriodo.GetPeriodoClienteResult[0].Periodo;
								if (dataPeriodo.GetPeriodoClienteResult[0].Resultado == 0) {
									vm.showFiscales = false;
								} else {
									vm.showFiscales = true;
								}
							});
							vm.muestraCliente = true;
						} else {
							ngNotify.set('No se encontro ningun cliente con ese número de contrato.', 'error');
							reset();
						}
					});
				} else {
					ngNotify.set('El usuario no tiene permisos para ver a este cliente.', 'error');
					reset();
				}
			});
			$('.datosCliente').collapse('show');
			$('.conceptosCliente').collapse('show');
		}

		$rootScope.$on('realoadPagos', function() {
			reloadTables();
		});

		function reloadTables() {
			cajasFactory.dameDetallePago(vm.session).then(function(detallePago) {
				if (detallePago.GetDameDetalleListResult.length == 0) {
					vm.blockBaja = true;
					vm.blockPagar = true;
				} else {
					vm.blockBaja = false;
					vm.blockPagar = false;
				}
				vm.detallePago = detallePago.GetDameDetalleListResult;
				vm.detallePagoAux = vm.detallePago;
			});
			cajasFactory.dameSumaPago(vm.session).then(function(sumaPago) {
				vm.sumaPagos = sumaPago.GetSumaDetalleListResult;
			});
		}

		function buscarPorDomicilio() {
			PNotify.removeAll();
			vm.mostrarSuspencion = false;
			reset();
			vm.muestraClientesTable = true;
			vm.isCollapsed = !vm.isCollapsed;
			cajasFactory.buscarPorDireccion(vm.data.calle, vm.data.numero).then(function(data) {
				if (data.GetuspBusCliPorContratoSeparadoListResult.length == 0) {
					ngNotify.set('No se encontro ninguna coincidencia.', 'error');
					reset();
				} else {
					vm.todosClientes = data.GetuspBusCliPorContratoSeparadoListResult;
				}
			});
			resetBusquedas();
		}

		function reset() {
			vm.Cliente = '';
			vm.showConceptos = false;
			vm.showDatosCliente = false;
			vm.muestraCliente = false;
			vm.muestraClientesTable = false;
		}

		function resetBusquedas() {
			vm.data.contrato = '';
			vm.data.calle = '';
			vm.data.numero = '';
			vm.data.nombre = '';
			vm.data.apaterno = '';
			vm.data.amaterno = '';
		}

		var vm = this;
		vm.openHistorial = openHistorial;
		vm.openInformation = openInformation;
		$('.buscarContrato').collapse();
		vm.openAddList = openAddList;
		vm.openPay = openPay;
		vm.openReturn = openReturn;
		vm.openClabe = openClabe;
		vm.isNavCollapsed = true;
		vm.buscarPorContrato = buscarPorContrato;
		vm.muestraCliente = false;
		vm.buscarPorNombre = buscarPorNombre;
		vm.selectCliente = selectCliente;
		vm.buscarPorDomicilio = buscarPorDomicilio;
		vm.openSuspencion = openSuspencion;
		vm.guardaconcepto = guardaconcepto;
		vm.openDeleteList = openDeleteList;
		vm.adelantaPagos = adelantaPagos;
		vm.changeVendedor = changeVendedor;
		vm.changeSerie = changeSerie;
		vm.openEdoCuenta = openEdoCuenta;
		initialData();
	});
