<?php

declare(strict_types=1);

namespace App\Exception;

/**
 * Un email déjà porté par un compte, quel que soit le côté qui le découvre :
 * inscription couple (WED-49) comme création de prestataire par un admin. Un
 * seul `app_user.email` unique pour les deux, donc une seule exception.
 *
 * Elle existe pour son `CODE`, pas pour son message. Le frontend doit pouvoir
 * distinguer « cet email a déjà un compte » — le seul cas où il propose de se
 * connecter plutôt que de corriger le champ (WED-162) — de n'importe quelle
 * autre erreur métier. Sans code machine, il lui faudrait comparer une phrase
 * en français, qui changerait au premier ajustement de copie.
 *
 * Elle reste une `DomainException` : le mapping HTTP appartient à
 * `ExceptionListener`, qui la traite avant le cas général.
 */
final class EmailAlreadyUsedException extends \DomainException
{
    /** Contrat avec le frontend : c'est cette constante qu'il teste, pas le message. */
    public const CODE = 'EMAIL_ALREADY_USED';

    public function __construct(string $message = 'Cet email est déjà utilisé.')
    {
        parent::__construct($message, 409);
    }
}
