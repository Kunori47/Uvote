// Utilidad para obtener el provider de wallet correcto
// Prioriza SubWallet sobre MetaMask cuando ambos están instalados

export const getWalletProvider = (): any => {
    // Verificar que estamos en el navegador
    if (typeof window === 'undefined') {
        return null;
    }

    // Priorizar SubWallet si está instalado (incluso si MetaMask también está instalado)
    // SubWallet se inyecta en window.SubWallet cuando detecta MetaMask
    if ((window as any).SubWallet) {
        return (window as any).SubWallet;
    }

    // Si no hay SubWallet, usar window.ethereum (puede ser MetaMask u otra wallet)
    if ((window as any).ethereum) {
        return (window as any).ethereum;
    }

    return null;
};
