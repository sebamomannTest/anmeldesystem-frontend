import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {AppointmentComponent} from './appointment.component';
import {AppointmentDataComponent} from './appointment-data/appointment-data.component';
import {
  MatBadgeModule,
  MatCardModule,
  MatDialogModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatProgressBarModule,
  MatSnackBarModule
} from '@angular/material';
import {RouterTestingModule} from '@angular/router/testing';
import {FormsModule} from '@angular/forms';
import {WINDOW_PROVIDERS} from '../../provider/window.provider';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {IEnrollmentModel} from '../../models/IEnrollment.model';
import {HttpClientTestingModule} from '@angular/common/http/testing';

function createEnrollment(id1: boolean, id2: boolean, id3: boolean, id4: boolean, driver: boolean, passenger: boolean): IEnrollmentModel {
  const obj: IEnrollmentModel = {
    name: (driver ? 'Driver' : 'Passenger') + Math.random(),
    comment: 'This is my cool comment',
    comments: [],
    driver: (driver ? {seats: 3, service: 1} : null),
    passenger: (passenger ? {requirement: 1} : null),
    additions: [],
    iat: '01-01-2019 00:00:00',
  };
  if (id1) {
    obj.additions.push({id: 'id1', name: 'Megges'});
  }
  if (id2) {
    obj.additions.push({id: 'id2', name: 'Bk'});
  }
  if (id3) {
    obj.additions.push({id: 'id3', name: 'Subway'});
  }
  if (id4) {
    obj.additions.push({id: 'id4', name: 'Diner'});
  }
  return obj;
}

function createFilter(b1: boolean, b2: boolean, b3: boolean, b4: boolean, explicitly: string, driverPassenger: string) {
  return {
    additions: [
      {id: 'id1', active: b1},
      {id: 'id2', active: b2},
      {id: 'id3', active: b3},
      {id: 'id4', active: b4}
    ],
    driverPassenger,
    explicitly,
  };
}

describe('AppointmentComponent', () => {
  let component: AppointmentComponent;
  let fixture: ComponentFixture<AppointmentComponent>;

  const DriverMc = createEnrollment(true, false, false, false, true, false);
  const DriverMcBk = createEnrollment(true, true, false, false, true, false);
  const DriverSubwayDiner = createEnrollment(false, false, true, true, true, false);
  const DriverSubwayDiner2 = createEnrollment(false, false, true, true, true, false);
  const DriverSubwayDiner3 = createEnrollment(false, false, true, true, true, false);
  const DriverMcBkSubway = createEnrollment(true, true, true, false, true, false);
  const DriverBkSubwayDiner = createEnrollment(false, true, true, true, true, false);
  const DriverAll1 = createEnrollment(true, true, true, true, true, false);
  const DriverAll2 = createEnrollment(true, true, true, true, true, false);

  const PassengerMc = createEnrollment(true, false, false, false, false, true);
  const PassengerDiner = createEnrollment(false, false, false, true, false, true);
  const PassengerMcBk = createEnrollment(true, true, false, false, false, true);
  const PassengerMcBk2 = createEnrollment(true, true, false, false, false, true);
  const PassengerMcSubway = createEnrollment(true, false, true, false, false, true);
  const PassengerBkDiner = createEnrollment(false, true, false, true, false, true);
  const PassengerBkSubwayDiner = createEnrollment(false, true, true, true, false, true);
  const PassengerAll1 = createEnrollment(true, true, true, true, false, true);
  const PassengerAll2 = createEnrollment(true, true, true, true, false, true);


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MatIconModule, MatBadgeModule,
        MatExpansionModule, RouterTestingModule,
        MatCardModule, FormsModule,
        MatFormFieldModule, MatDialogModule,
        MatSnackBarModule, BrowserAnimationsModule,
        MatInputModule, MatProgressBarModule,
        HttpClientTestingModule],
      declarations: [AppointmentComponent, AppointmentDataComponent],
      providers: [WINDOW_PROVIDERS]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppointmentComponent);
    component = fixture.componentInstance;
    component.appointment = {
      title: 'Test Termin',
      description: 'This is a very very cool date because I created it lol',
      location: 'Hier lol',
      creator: 'TestCreator',
      date: '01-01-2020 00:00:00',
      deadline: '01-01-2019 00:00:00',
      link: 'ABCDE',
      maxEnrollments: 10,
      files: [],
      additions: [
        {
          id: 'id1',
          name: 'Megges'
        },
        {
          id: 'id2',
          name: 'BK'
        },
        {
          id: 'id3',
          name: 'Subway'
        },
        {
          id: 'id4',
          name: 'Diner'
        }
      ],
      driverAddition: true,
      enrollments: [DriverMc,
        DriverMcBk,
        DriverSubwayDiner, DriverSubwayDiner2, DriverSubwayDiner3,
        DriverMcBkSubway,
        DriverBkSubwayDiner,
        DriverAll1, DriverAll2,
        PassengerMc,
        PassengerDiner,
        PassengerMcBk, PassengerMcBk2,
        PassengerMcSubway,
        PassengerBkDiner,
        PassengerBkSubwayDiner,
        PassengerAll1, PassengerAll2]
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('correct filter: mc, explicit', () => {
    component.filter = createFilter(true, false, false, false, 'explicit', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverMc, PassengerMc]);
  });

  it('correct filter: diner, explicit, passenger', () => {
    component.filter = createFilter(false, false, false, true, 'explicit', 'passenger');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([PassengerDiner]);
  });

  it('correct filter: two (mc, bk), explicit', () => {
    component.filter = createFilter(true, true, false, false, 'explicit', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverMcBk, PassengerMcBk, PassengerMcBk2]);
  });

  it('correct filter: two (subway, diner), explicit, driver', () => {
    component.filter = createFilter(false, false, true, true, 'explicit', 'driver');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverSubwayDiner, DriverSubwayDiner2, DriverSubwayDiner3]);
  });

  it('correct filter: three, explicit', () => {
    component.filter = createFilter(false, true, true, true, 'explicit', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverBkSubwayDiner, PassengerBkSubwayDiner]);
  });

  it('correct filter: three (bk, subway, diner), explicit, passenger', () => {
    component.filter = createFilter(false, true, true, true, 'explicit', 'passenger');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([PassengerBkSubwayDiner]);
  });

  it('correct filter: all, explicit', () => {
    component.filter = createFilter(true, true, true, true, 'explicit', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverAll1, DriverAll2, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: all, explicit, driver', () => {
    component.filter = createFilter(true, true, true, true, 'explicit', 'driver');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverAll1, DriverAll2]);
  });

  /* SEMI EXPLICIT */
  it('correct filter: mc, semiExplicit', () => {
    component.filter = createFilter(true, false, false, false, 'semiExplicit', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverMc, DriverMcBk, DriverMcBkSubway, DriverAll1, DriverAll2, PassengerMc, PassengerMcBk,
      PassengerMcBk2, PassengerMcSubway, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: diner, semiExplicit, passenger', () => {
    component.filter = createFilter(false, false, false, true, 'semiExplicit', 'passenger');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([PassengerDiner, PassengerBkDiner, PassengerBkSubwayDiner, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: two (mc, bk), semiExplicit', () => {
    component.filter = createFilter(true, true, false, false, 'semiExplicit', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverMcBk, DriverMcBkSubway, DriverAll1, DriverAll2, PassengerMcBk, PassengerMcBk2, PassengerAll1,
      PassengerAll2]);
  });

  it('correct filter: two (subway, diner), semiExplicit, driver', () => {
    component.filter = createFilter(false, false, true, true, 'semiExplicit', 'driver');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverSubwayDiner, DriverSubwayDiner2, DriverSubwayDiner3, DriverBkSubwayDiner, DriverAll1,
      DriverAll2]);
  });

  it('correct filter: three (bs, subway, diner), semiExplicit', () => {
    component.filter = createFilter(false, true, true, true, 'semiExplicit', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverBkSubwayDiner, DriverAll1, DriverAll2, PassengerBkSubwayDiner, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: three (bk, subway, diner), semiExplicit, passenger', () => {
    component.filter = createFilter(false, true, true, true, 'semiExplicit', 'passenger');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([PassengerBkSubwayDiner, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: all, semiExplicit', () => {
    component.filter = createFilter(true, true, true, true, 'semiExplicit', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverAll1, DriverAll2, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: all, semiExplicit, driver', () => {
    component.filter = createFilter(true, true, true, true, 'semiExplicit', 'driver');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverAll1, DriverAll2]);
  });

  /* DYNAMIC */
  it('correct filter: mc, dynamic', () => {
    component.filter = createFilter(true, false, false, false, 'dynamic', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverMc, DriverMcBk, DriverMcBkSubway, DriverAll1, DriverAll2, PassengerMc, PassengerMcBk,
      PassengerMcBk2, PassengerMcSubway, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: diner, dynamic, passenger', () => {
    component.filter = createFilter(false, false, false, true, 'dynamic', 'passenger');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([PassengerDiner, PassengerBkDiner, PassengerBkSubwayDiner, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: two (mc, bk), dynamic', () => {
    component.filter = createFilter(true, true, false, false, 'dynamic', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverMc, DriverMcBk, DriverMcBkSubway, DriverBkSubwayDiner, DriverAll1, DriverAll2, PassengerMc,
      PassengerMcBk, PassengerMcBk2, PassengerMcSubway, PassengerBkDiner, PassengerBkSubwayDiner, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: two (subway, diner), dynamic, driver', () => {
    component.filter = createFilter(false, false, true, true, 'dynamic', 'driver');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverSubwayDiner, DriverSubwayDiner2, DriverSubwayDiner3, DriverMcBkSubway, DriverBkSubwayDiner,
      DriverAll1, DriverAll2]);
  });

  it('correct filter: three (bk, subway, diner), dynamic', () => {
    component.filter = createFilter(false, true, true, true, 'dynamic', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverMcBk, DriverSubwayDiner, DriverSubwayDiner2, DriverSubwayDiner3, DriverMcBkSubway,
      DriverBkSubwayDiner, DriverAll1, DriverAll2, PassengerDiner, PassengerMcBk, PassengerMcBk2, PassengerMcSubway, PassengerBkDiner,
      PassengerBkSubwayDiner, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: three (bk, subway, diner), dynamic, passenger', () => {
    component.filter = createFilter(false, true, true, true, 'dynamic', 'passenger');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([PassengerDiner, PassengerMcBk, PassengerMcBk2, PassengerMcSubway, PassengerBkDiner,
      PassengerBkSubwayDiner, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: all, dynamic', () => {
    component.filter = createFilter(true, true, true, true, 'dynamic', '');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverMc, DriverMcBk, DriverSubwayDiner, DriverSubwayDiner2, DriverSubwayDiner3, DriverMcBkSubway,
      DriverBkSubwayDiner, DriverAll1, DriverAll2, PassengerMc, PassengerDiner, PassengerMcBk, PassengerMcBk2, PassengerMcSubway,
      PassengerBkDiner, PassengerBkSubwayDiner, PassengerAll1, PassengerAll2]);
  });

  it('correct filter: all, dynamic, driver', () => {
    component.filter = createFilter(true, true, true, true, 'dynamic', 'driver');
    const filtered = component.filterEnrollments();
    expect(filtered).toEqual([DriverMc, DriverMcBk, DriverSubwayDiner, DriverSubwayDiner2, DriverSubwayDiner3, DriverMcBkSubway,
      DriverBkSubwayDiner, DriverAll1, DriverAll2]);
  });
});
