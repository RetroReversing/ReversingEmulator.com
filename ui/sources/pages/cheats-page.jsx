import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonModal, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { add, checkmarkCircleOutline, closeCircleOutline, buildOutline } from 'ionicons/icons';
import { useState } from 'react';
import { CheatList } from '../entities/cheat';
import { EditCheatModal } from '../modals/edit-cheat-modal';
import * as Requests from '../services/requests';
import * as Database from '../services/database';

export const CheatsPage = () => {

	const [modal, setModal] = useState(false);
	const [currentList, setCurrentList] = useState(null);
	const [currentCheat, setCurrentCheat] = useState(null);

	const [lists, setLists] = useState([]);
	const [systems, setSystems] = useState([]);

	const showModal = (list, cheat) => {
		setCurrentList(list);
		setCurrentCheat(cheat);
		setModal(true);
	}

	const deleteCheat = async (list, cheat) => {
		list.cheats = list.cheats.filter(x => x != cheat);

		if (list.cheats.length) {
			await Database.updateCheat(list);

		} else {
			await Database.removeCheat(list);
		}

		setLists(await Database.getCheats());
	};

	const apply = async (cheat, system, game) => {
		const list = currentList
			|| lists.find(x => x.system == system.name && x.game == game.name)
			|| CheatList.fromGame(system, game);

		if (cheat != currentCheat)
			list.cheats.push(cheat);

		await Database.updateCheat(list);

		setLists(await Database.getCheats());
		setModal(false);
	};

	const dismiss = () => {
		setModal(false);
	}

	useIonViewWillEnter(async () => {
		setLists(await Database.getCheats());
		setSystems(await Requests.getSystems());
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Cheats</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => showModal()}>
							<IonIcon slot="icon-only" icon={add} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent class="cheats">
				<IonModal isOpen={modal}>
					<EditCheatModal current={currentCheat} systems={systems} apply={apply} dismiss={dismiss}  />
				</IonModal>

				<IonList lines="none">
					{lists.map(list => list.cheats.map(cheat =>
						<IonCard key={list.system + list.game + cheat.name}>
							<IonItemSliding>
								<IonItem color="light">
									{
										cheat.enabled ?
											<IonIcon color="success" icon={checkmarkCircleOutline} slot="start"></IonIcon> :
											<IonIcon color="danger" icon={closeCircleOutline} slot="start"></IonIcon>
									}
									<IonLabel>
										<h2>{cheat.name}</h2>
										<h3>{list.game}</h3>
										<h3>{list.system}</h3>
									</IonLabel>
									<IonButton onClick={() => showModal(list, cheat)} fill="clear">
										<IonIcon slot="icon-only" icon={buildOutline} />
									</IonButton>
								</IonItem>
								<IonItemOptions side="end">
									<IonItemOption color="danger" onClick={() => deleteCheat(list, cheat)}>Delete</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						</IonCard>
					))}
				</IonList>
			</IonContent>

		</IonPage>
	);
};
