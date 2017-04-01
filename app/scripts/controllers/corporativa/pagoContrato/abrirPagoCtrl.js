'use strict';
angular.module('softvApp').controller('AbrirPagoCtrl', AbrirPagoCtrl);

function AbrirPagoCtrl($uibModal, $state, $rootScope, cajasFactory, ngNotify, inMenu, $uibModalInstance, items) {

    function aceptar() {
		var metodo = vm.tipo
		if (vm.tipo == null || vm.tipo == undefined) {
			ngNotify.set('Seleccione un método de pago.', 'error')
		}else if (vm.tipo == 1) {
			$uibModalInstance.dismiss('cancel');
            vm.animationsEnabled = true;
			var modalInstance = $uibModal.open({
				animation: vm.animationsEnabled,
				ariaLabelledBy: 'modal-title',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'views/corporativa/escogerPago.html',
				controller: 'EscogerPagoCtrl',
				controllerAs: '$ctrl',
				backdrop: 'static',
				keyboard: false,
				size: 'md',
                resolve: {
                    items: function() {
                        return items;
                    },
					metodo: function() {
						return metodo;
					}
                }
			});
        }else{
            $uibModalInstance.dismiss('cancel');
            vm.animationsEnabled = true;
			var modalInstance = $uibModal.open({
				animation: vm.animationsEnabled,
				ariaLabelledBy: 'modal-title',
				ariaDescribedBy: 'modal-body',
				templateUrl: 'views/corporativa/pagarContado.html',
				controller: 'PagarContadoCtrl',
				controllerAs: '$ctrl',
				backdrop: 'static',
				keyboard: false,
				size: 'md',
                resolve: {
                    items: function() {
                        return items;
                    },
					metodo: function() {
						return metodo;
					}
                }
			});
        }
    }

    function cancel() {
		$uibModalInstance.dismiss('cancel');
	}

    var vm = this;
    vm.aceptar = aceptar;
    vm.cancel = cancel;
}
