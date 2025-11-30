import { useState, useEffect } from 'react';
import './Login.css'; // Reutilizando estilos do Login para consistência
import { auth } from '../firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

export function ResetPassword({ oobCode, onBackToLogin }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        // Verifica se o código é válido ao carregar
        verifyPasswordResetCode(auth, oobCode)
            .then((email) => {
                setEmail(email);
                setVerifying(false);
            })
            .catch((error) => {
                console.error(error);
                setVerifying(false);
                setError('O link de recuperação é inválido ou expirou.');
            });
    }, [oobCode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setSuccess(true);
            setTimeout(() => {
                onBackToLogin();
            }, 3000);
        } catch (error) {
            console.error(error);
            setError('Erro ao redefinir senha: ' + error.message);
        }
    };

    if (verifying) {
        return (
            <div className="lumen-container">
                <div className="lumen-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
                    <h2>Verificando link...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="lumen-container">
            <div className="lumen-left">
                <div className="lumen-header">
                    <div className="brand-logo">
                        <div className="logo-circle"></div>
                        <span>Lumen</span>
                    </div>
                </div>

                <div className="lumen-content">
                    <h1>Definir nova senha</h1>
                    {email && <p className="subtitle">Para a conta: {email}</p>}

                    {success ? (
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <h2 style={{ color: '#4caf50' }}>Senha alterada com sucesso!</h2>
                            <p className="subtitle">Você será redirecionado para o login em instantes...</p>
                            <button onClick={onBackToLogin} className="submit-btn" style={{ marginTop: '1rem' }}>
                                Ir para Login agora
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="lumen-form">
                            {error && !email && (
                                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                    <div className="error-message">{error}</div>
                                    <button onClick={onBackToLogin} className="link-btn" style={{ marginTop: '1rem' }}>
                                        Voltar ao Login
                                    </button>
                                </div>
                            )}

                            {!error || email ? (
                                <>
                                    <div className="input-group">
                                        <label>Nova Senha</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Confirmar Nova Senha</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>

                                    {error && <div className="error-message">{error}</div>}

                                    <div className="form-actions">
                                        <button type="submit" className="submit-btn" style={{ width: '100%' }}>
                                            Alterar Senha
                                        </button>
                                    </div>
                                </>
                            ) : null}
                        </form>
                    )}
                </div>
            </div>

            <div className="lumen-right">
                {/* Imagem de fundo via CSS */}
            </div>
        </div>
    );
}
