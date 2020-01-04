import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, Validators} from '@angular/forms';
import {UrlService} from '../../../services/url.service';
import {MatAutocomplete, MatAutocompleteSelectedEvent, MatChipInputEvent, MatDialog, MatStepper} from '@angular/material';
import {COMMA, SPACE, TAB} from '@angular/cdk/keycodes';
import {Observable, Subscription} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {CreateAppointmentModel} from '../../../models/createAppointment.model';
import {HttpClient, HttpErrorResponse, HttpEventType} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import {TemplateDialogComponent} from '../../dialogs/template-dialog/template-dialog.component';
import {isObject} from 'util';
import {AppointmentService} from '../../../services/appointment.service';
import {IFileModelUpload} from '../../../models/IFileModelUpload.model';
import {Router} from '@angular/router';

const HttpStatus = require('http-status-codes');

@Component({
  selector: 'app-appointment-create',
  templateUrl: './appointment-create.component.html',
  styleUrls: ['./appointment-create.component.scss']
})
export class AppointmentCreateComponent implements OnInit {

  @ViewChild('stepper', null) stepper: MatStepper;
  // FormGroups
  overallDataFormGroup: any;
  additionFormGroup: any;
  linkFormGroup: any;
  doneGroup: any;
  administrationFormGroup: any;

  /* Addition Form */
  driverAddition = false;

  /* Administration Form */
  users: string[] = [];
  filteredUsers: Observable<string[]>;

  /* FILE UPLOAD */
  public files: Array<{ file: File, done: boolean }> = [];
  allUsers: string[] = ['benutzer1@sebamomann.de', 'text@example.de', 'mama@mia.com', 'foo@bar.tld', 'hallo@helmut.rofl'];
  readonly separatorKeysCodes: number[] = [COMMA, SPACE, TAB];
  @ViewChild('userInput', {static: false}) userInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto', {static: false}) matAutocomplete: MatAutocomplete;
  private fileData: IFileModelUpload[] = [];
  private fileBlob: Blob;
  private percentDone = 0;

  constructor(private formBuilder: FormBuilder, public urlService: UrlService, private http: HttpClient, private sanitizer: DomSanitizer,
              public dialog: MatDialog, private appointmentService: AppointmentService, private router: Router) {

    this.overallDataFormGroup = this.formBuilder.group({
      title: ['', Validators.required],
      date: ['', Validators.required],
      deadline: [''],
      location: ['', Validators.required],
      maxEnrollments: [''],
    });

    this.additionFormGroup = this.formBuilder.group({
      additions: new FormArray([new FormControl()]),
      driverAddition: new FormControl()
    });

    this.linkFormGroup = this.formBuilder.group({
      link: new FormControl(),
      description: new FormControl()
    });

    this.administrationFormGroup = this.formBuilder.group({
      users: new FormControl()
    });

    this.doneGroup = this.formBuilder.group({
      saveAsTemplate: new FormControl()
    });

    // Not yet working
    // noinspection TypeScriptValidateJSTypes
    this.filteredUsers = this.administrationFormGroup.get('users').valueChanges.pipe(
      startWith(null),
      map((user: string | null) => user ? this._filter(user) : this.allUsers.slice()));
  }

  async create() {
    if (!this.overallDataFormGroup.valid ||
      !this.additionFormGroup.valid ||
      !this.linkFormGroup.valid ||
      !this.doneGroup.valid ||
      !this.administrationFormGroup.valid) {
      return;
    }
    const additions = [];
    this.additionFormGroup.controls.additions.controls.forEach(field => field.value != null ? additions.push({name: field.value}) : '');

    let output: CreateAppointmentModel;
    output = {
      title: this.overallDataFormGroup.get('title').value,
      description: this.linkFormGroup.get('description').value,
      link: this.linkFormGroup.get('link').value,
      location: this.overallDataFormGroup.get('title').value,
      date: this.overallDataFormGroup.get('date').value,
      deadline: this.overallDataFormGroup.get('deadline').value,
      maxEnrollments: this.overallDataFormGroup.get('maxEnrollments').value,
      additions,
      driverAddition: this.driverAddition,
      administrators: this.users,
      files: this.fileData,
    };


    this.appointmentService
      .create(output)
      .subscribe(
        result => {
          if (result.type === HttpEventType.UploadProgress) {
            this.percentDone = Math.round(100 * result.loaded / result.total);
            console.log(result.loaded);
          } else if (result.type === HttpEventType.Response) {
            setTimeout(() => {
              if (result.status === HttpStatus.CREATED) {
                this.router.navigate([`enroll`], {queryParams: {val: result.body.link}});
              }
            }, 2000);
          }
        },
        (err: HttpErrorResponse) => {
          if (err.status === HttpStatus.BAD_REQUEST) {
            if (err.error.code === 'DUPLICATE_ENTRY') {
              err.error.error.forEach(fColumn => {
                  const uppercaseName = fColumn.charAt(0).toUpperCase() + fColumn.substring(1);
                  const fnName: string = 'get' + uppercaseName;
                  this[fnName]().setErrors({inUse: true});
                  const fnNameForIndex = 'getFormGroupIndexOf' + uppercaseName;
                  this.stepper.selectedIndex = this[fnNameForIndex]();
                }
              );
            }
          }
        }
      );
  }

  ngOnInit() {
  }

  addAddition(value: string | null = null) {
    return (this.additionFormGroup.controls.additions as FormArray).push(new FormControl(value));
  }

  /* FILE UPLOAD */
  selectFile() {
    const fileUpload = document.getElementById('fileUpload') as HTMLInputElement;
    fileUpload.onchange = () => {
      // tslint:disable-next-line:prefer-for-of
      for (let index = 0; index < fileUpload.files.length; index++) {
        const file = fileUpload.files[index];
        this.files.push({file, done: false});
      }
      this.uploadFiles();
    };
    fileUpload.click();
  }

  /* Addition Form */
  removeAddition(index: number) {
    this.additionFormGroup.controls.additions.removeAt(index);
  }

  hasAdditions() {
    return this.additionFormGroup.controls.additions.controls.some(addition => addition.value !== null)
      || this.additionFormGroup.get('driverAddition').value;
  }

  /* Administration Form */
  add(event: MatChipInputEvent) {
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      if ((value || '').trim()) {
        this.users.push(value.trim());
      }

      if (input) {
        input.value = '';
      }

      this.administrationFormGroup.get('users').setValue(null);
    }
  }

  removeUser(user): void {
    const index = this.users.indexOf(user);

    if (index >= 0) {
      this.users.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.users.push(event.option.viewValue);
    this.userInput.nativeElement.value = '';
    this.administrationFormGroup.get('users').setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allUsers.filter(user => user.toLowerCase().indexOf(filterValue) === 0);
  }

  async toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  /* Template selection*/
  openAppointmentTemplateDialog() {
    const dialogRef = this.dialog.open(TemplateDialogComponent, {
      width: '90%',
      maxWidth: 'initial',
      height: 'auto',
      maxHeight: '80vh',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (isObject(result)) {
        this.overallDataFormGroup.get('title').setValue(result.title);
        this.overallDataFormGroup.get('location').setValue(result.location);
        this.overallDataFormGroup.get('maxEnrollments').setValue(result.maxEnrollments);

        this.linkFormGroup.get('description').setValue(result.description);
        result.additions.forEach(addition => {
          this.addAddition(addition.name);
        });

        this.driverAddition = result.driverAddition;
      }
    });
  }

  getLinkErrorMessage(): string {
    if (this.getLink().hasError('inUse')) {
      return 'Dieser Link ist leider schon in Benutzung';
    }
  }

  private getFormGroupIndexOfLink() {
    return 2;
  }

  private async uploadFile(file) {
    this.fileBlob = new Blob([file.file], {type: 'application/octet-stream'});
    const result = await this.toBase64(this.fileBlob).catch(e => e);
    if (result instanceof Error) {
      return;
    }
    const encoder = new TextEncoder();
    this.fileData.push({name: file.file.name, data: result.toString()});
    setTimeout(() => {
        file.done = true;
      },
      1000);
  }

  private uploadFiles() {
    const fileUpload = document.getElementById('fileUpload') as HTMLInputElement;
    fileUpload.value = '';

    this.files.forEach(file => {
      this.uploadFile(file);
    });
  }

  private getLink() {
    return this.linkFormGroup.get('link');
  }
}

export class FileUploadModel {
  data: File;
  state: string;
  inProgress: boolean;
  progress: number;
  canRetry: boolean;
  canCancel: boolean;
  sub?: Subscription;
}
