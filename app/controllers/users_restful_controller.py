import simplejson as json # instead of import json
# from app.models.user_model import UserModel
# from app.models.conversation_model import ConversationModel
# from app.models.room_model import RoomModel
# from app.models.user_group_model import UserGroupModel
# from app.models.token_model import TokenModel
# from app.models.link_token_model import LinkTokenModel
# from app.controllers.email_sender import sendEmail
# from app.models.task_model import TaskModel
from extensions import db
import googlemaps
import os
from os import path, environ
from werkzeug.utils import secure_filename
import uuid
import datetime
from datetime import datetime as dt
from datetime import timezone
import app.controllers.sockets as sockets
from sqlalchemy.orm.attributes import flag_modified
from dateutil import parser
from app import socketio
from flask import jsonify
import app.controllers.digitalocean as digitalocean
from time import sleep
import requests
from app.controllers.sockets import socket_users

socket_messages = {}

static_img_url = "https://vindkamer.ams3.cdn.digitaloceanspaces.com/vindkamer/user_upload/"

client = digitalocean.get_spaces_client(
    region_name="am3",
    endpoint_url="https://vindkamer.ams3.digitaloceanspaces.com",
    key_id="DO00ZWM7K6BEZLTB3G9D",
    secret_access_key="ydsbi6wStPMyQrjEv9lXgXOaKYGEJtPLpQC0QvPiZNE"
)


def ran_string(string_length=10):
    """Returns a random string of length string_length."""
    random = str(uuid.uuid4()) # Convert UUID format to a Python string.
    random = random.upper() # Make all characters uppercase.
    random = random.replace("-","") # Remove the UUID '-'.
    return random[0:string_length] # Return the random string.

def message_received(message_id, client_id):
    socket_messages[message_id] = [x for x in socket_messages[message_id] if not x==client_id]
    print('SOCKET_MESSAGES ', socket_messages)
    if len(socket_messages[message_id])==0:
        del socket_messages[message_id]

def parse_bool(str):
    if(str.lower()=="yes" or str.lower()=="true"):
        return True
    else:
        return False

def socket_message_handler(socket_data,chat_uuid):
    global socket_users
    i = 0
    sleep(1)
    while (socket_data["message_id"] in socket_messages) and (i<3):
        print("ATTEMPTING TO EMIT AGAIN")
        sleep(2)
        print("SOCKET USERS ",socket_users)

        for user_uuid, socket_user_id in socket_users.items():
            print("SOCKET USER ID ",socket_user_id)
            if user_uuid in socket_messages[socket_data["message_id"]]:
                socketio.emit("chat_message_sent", socket_data, json=True, to=socket_user_id, callback=message_received)
                socketio.sleep(0)
        i+=1

class Users_RestfulController:

    def checkCookies(self, user_uuid, token):
        token = TokenModel.query.filter_by(token=token).first()
        if(token.user_uuid==user_uuid):
            user = UserModel.query.filter_by(uuid=user_uuid).first()
            if(user.id_verified and user.bank_verified):
                user.last_active = dt.now(timezone.utc)
                flag_modified(user,"last_active")
                db.session.commit()
                return True, True
            else:
                return True, False
        else:
            return False, False

    def checkLinkToken(self, item_uuid, token):
        link_token = LinkTokenModel.query.filter_by(token=token).first()
        timestamp = link_token.timestamp
        delta_hours = (dt.now(timezone.utc)-timestamp).total_seconds()/3600
        if(link_token.item_uuid==item_uuid and delta_hours<24):
            return True
        else:
            return False

    def flag_user(self, view, request):
        data = json.loads(request.form.get('json_data'))
        if(self.checkCookies(data['uuid'],data['token'])[0]):
            user = UserModel.query.filter_by(uuid=data['uuid']).first()
            flags = user.flags

            if(data["flag"]==0):
                flags[0] += 1
            elif(data["flag"]==1):
                flags[1] += 1
            elif(data["flag"]==2):
                flags[2] += 1
            elif(data["flag"]==3):
                flags[3] += 1

            flag_modified(user,"flags")
            user.flags = flags
            db.session.commit()
            task_data = {}
            task_data["recipient"] = "admin@vindkamer.nl"
            task_data["user_uuid"] = data['flagged_uuid']
            task_data["flags"]  = flags
            if((flags[0]>2) or (flags[1]>2) or (flags[2]>10)):
                sendEmail("FLAGS",data=data)

            return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
        else:
            return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

    def toggle_user_visibility(self, view, request):

        data = json.loads(request.form.get('json_data'))
        user_check = self.checkCookies(data['uuid'],data['token'])
        if(user_check[0]):
            if(user_check[1]):
                user = UserModel.query.filter_by(uuid=data['uuid']).first()
                visibility = user.visible
                landlord = user.landlord

                if(not landlord):
                    if(visibility):
                        user.visible = False
                    else:
                        user.visible = True

                    flag_modified(user,"visible")

                    db.session.commit()

                    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
                else:
                    return json.dumps({'success': False,'message': "To show yourself in the pool, please deselect landlord mode"}), 400, {'ContentType': 'application/json'}

            else:
                return json.dumps({'success': False,'message': "VERIFY"}), 400, {'ContentType': 'application/json'}

        else:
            return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

    def toggle_listing_visibility(self, view, request):

        data = json.loads(request.form.get('json_data'))
        user_check = self.checkCookies(data['uuid'],data['token'])

        if(user_check[0]):
            if(user_check[1]):
                room = RoomModel.query.filter_by(uuid=data['room_uuid']).first()
                visibility = room.visible

                if(visibility):
                    room.visible = False
                else:
                    room.visible = True

                flag_modified(room,"visible")

                db.session.commit()

                return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
            else:
                return json.dumps({'success': False,'message': "VERIFY"}), 400, {'ContentType': 'application/json'}

        else:
            return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}


    def toggle_landlord(self, view, request):

        data = json.loads(request.form.get('json_data'))
        if(self.checkCookies(data['uuid'],data['token'])[0]):
            user = UserModel.query.filter_by(uuid=data['uuid']).first()
            landlord = user.landlord

            if(landlord):
                user.landlord = False
                user.visible = True

            else:
                user.landlord = True
                user.visible = False

            flag_modified(user,"landlord")
            flag_modified(user,"visible")

            db.session.commit()

            return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
        else:
            return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

    def toggle_email(self, view, request):

        data = json.loads(request.form.get('json_data'))
        if(self.checkCookies(data['uuid'],data['token'])[0]):
            user = UserModel.query.filter_by(uuid=data['uuid']).first()
            email_notify = user.email_notify

            if(email_notify):
                user.email_notify = False

            else:
                user.email_notify = True

            flag_modified(user,"email_notify")

            db.session.commit()

            return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
        else:
            return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}


    def delete_user(self, view, request):

        data = json.loads(request.form.get('json_data'))
        if(self.checkCookies(data['uuid'],data['token'])[0]):
            UserModel.query.filter_by(uuid=data['uuid']).delete()
            UserGroupModel.query.filter_by(owner_uuid=data['uuid']).delete()
            RoomModel.query.filter_by(owner_uuid=data['uuid']).delete()
            delete_chats = ConversationModel.query.filter(ConversationModel.user_uuids.any((data['uuid']))).all()

            for chat in delete_chats:
                user_uuids = chat.user_uuids
                if data['uuid'] in user_uuids: user_uuids.remove(data['uuid'])
                chat.user_uuids = user_uuids
                if (len(chat.user_uuids)==1):
                    db.session.delete(chat)

            # db.session.delete(user_rooms)
            # db.session.delete(user_groups)
            db.session.commit()

            return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
        else:
            return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}



    def update_user_profile(self, view, request):
        data = json.loads(request.form.get('json_data'))
        # img_01 = request.form.get('img_01')
        # print(data['uuid'])
        if(self.checkCookies(data['uuid'],data['token'])[0]):
            user = UserModel.query.filter_by(uuid=data['uuid']).first()
            image_paths = [None] * 4

            for i,v in enumerate(user.image_url):
                image_paths[i] = v
            i = 0
            for k,v in request.files.items():
                # print("ROOT PATH : ",str())
                f = request.files[k]
                img_name = ran_string()
                IMG_PATH = os.getcwd()+"/static/img/user_upload/"+img_name+".png"
                f.save(IMG_PATH)

                # print(os.path.getsize(IMG_PATH))
                if(os.path.getsize(IMG_PATH)>125):
                    image_paths[i]=static_img_url+img_name+".png"
                    digitalocean.upload_file_to_space(
                        client,
                        "vindkamer",
                        IMG_PATH,
                        "user_upload/"+img_name+".png",
                        is_public=True
                    )

                i+=1
            # print(data)
            if('user_city' in data):
                user.city = data['user_city']
            if('user_gender_preference' in data):
                user.gender_preference = data['user_gender_preference']
            if('user_budget' in data):
                user.budget = data['user_budget']
            if('user_dutch' in data):
                user.dutch = parse_bool(data['user_dutch'])
            if('user_LGBTQ' in data):
                user.LGBTQ = parse_bool(data['user_LGBTQ'])
            if('bio' in data):
                user.bio = data['bio']
            if('user_registration' in data):
                user.registration = parse_bool(data['user_registration'])

            if('user_student' in data):
                user.student = parse_bool(data['user_student'])

            if('user_age' in data):
                user.age = data['user_age']

            if('user_languages' in data):
                if type(data['user_languages']) == list:
                    user.languages = data['user_languages']
                else:

                    language_list = []
                    language_list.append(data['user_languages'])
                    user.languages = language_list
                    # flag_modified(user,"languages")

            if('landlord_type' in data):
                user.landlord_type = data['landlord_type']
            if('company_name' in data):
                user.company_name = data['company_name']

            user.interests = [data['interest_1'],data['interest_2'],data['interest_3'],data['interest_4'],data['interest_5'],data['interest_6'],]

            if('looking_for' in data):
                if type(data['looking_for']) == list:
                    user.looking_for = data['looking_for']

                else:
                    looking_for_list = []
                    looking_for_list.append(data['looking_for'])
                    user.looking_for = looking_for_list


            user.image_url=image_paths

            db.session.commit()

            return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
        else:
            return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

    def edit_room(self, view, request):
        data = json.loads(request.form.get('json_data'))
        # img_01 = request.form.get('img_01')
        # print(data['uuid'])
        if(self.checkCookies(data['user_uuid'],data['token'])[0]):

            room = RoomModel.query.filter_by(uuid=data['uuid']).first()

            if(room.owner_uuid == data['user_uuid']):

                try:
                    gmaps_key = googlemaps.Client(key="AIzaSyCz4K-Ct6qrP34cUyp6WGcj5GSb8fWFMXI")
                    address = data['address']+","+ data['city']
                    g = gmaps_key.geocode(address)
                    lat =  round(g[0]["geometry"]["location"]["lat"],5)
                    long = round(g[0]["geometry"]["location"]["lng"],5)
                except:
                    print("GEOLOC failed")
                    lat = ""
                    long = ""
                    pass

                image_paths = [None] * 4

                for i,v in enumerate(room.images):
                    image_paths[i] = v
                i = 0
                for k,v in request.files.items():
                    # print("ROOT PATH : ",str())
                    f = request.files[k]
                    img_name = ran_string()
                    IMG_PATH = os.getcwd()+"/static/img/user_upload/"+img_name+".png"
                    f.save(IMG_PATH)

                    # print(os.path.getsize(IMG_PATH))
                    if(os.path.getsize(IMG_PATH)>125):
                        image_paths[i]=static_img_url+img_name+".png"
                        digitalocean.upload_file_to_space(
                            client,
                            "vindkamer",
                            IMG_PATH,
                            "user_upload/"+img_name+".png",
                            is_public=True
                        )

                    i+=1

                try:
                    start_date_str = dt.strptime(data['start_date'], '%d-%m-%Y')
                    start_date_str = start_date_str.strftime('%Y-%m-%d')
                    room.start_date = start_date_str
                except:
                    pass

                try:
                    end_date_str = dt.strptime(data['end_date'], '%d-%m-%Y')
                    end_date_str = end_date_str.strftime('%Y-%m-%d')
                    room.end_date = end_date_str
                except:
                    pass

                # room.visible=data['visible']
                # print('DATA ', data)

                room.rent = data['rent'],
                room.images = image_paths,
                room.geoLoc = [lat,long],
                room.description =data['description'],
                room.city = data['city'],
                room.address = data['address'],
                room.gender_preference = data['gender_preference'],
                room.neighborhood = data['neighborhood'],
                room.contract_type =data['contract_type'],
                room.rooms = data['rooms'],
                room.property_type = data['property_type'],
                room.registration = parse_bool(data['registration']),
                room.title =data['title']

                db.session.commit()

                return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
            else:
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}
        else:
            return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}


    def handle_users(self, view, request):
        if request.method == 'POST':
            if request.is_json:
                data = request.get_json()

                check_user_email = UserModel.query.filter_by(email=data['email']).first()

                if(check_user_email is None):
                    new_user = UserModel(first_name=data['first_name'], last_name=data['last_name'], age=data['age'],
                                         bio=data['bio'], budget=data['budget'], interests=data['interests'],
                                         email=data['email'], gender_preference=data['gender_preference'],
                                         image_url=data['image_url'], city=data['city'])
                    db.session.add(new_user)
                    db.session.commit()

                    #CREATE TOKEN FOR USER SESSION
                    new_token = TokenModel(user_uuid=str(new_user.uuid))
                    db.session.add(new_token)
                    db.session.commit()

                    return {"uuid": f"{new_user.uuid}","new_user": f"true","token": f"{new_token.token}"}

                else:
                    #CREATE TOKEN FOR USER SESSION
                    new_token = TokenModel(user_uuid=str(check_user_email.uuid))
                    db.session.add(new_token)
                    db.session.commit()

                    return {"uuid": f"{check_user_email.uuid}","new_user": f"false","token": f"{new_token.token}"}
            else:
                return {"error": "The request payload is not in JSON format"}

        elif request.method == 'GET':
            users = UserModel.query.all()
            results = [
                {
                    "uuid": user.uuid,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "budget": str(user.budget),
                    "interests": user.interests,
                    "email": user.email,
                    "bio": user.bio,
                    "gender_preference": user.gender_preference,
                    "image_url": user.image_url,
                    "city": user.city,
                    "age": str(user.age)

                } for user in users]

            return {"count": len(results), "users": results}

    def create_chat(self, view, request, userAuuid, userBuuid):
            data = json.loads(request.form.get('json_data'))
            user_check = self.checkCookies(data['uuid'],data['token'])
            if(user_check[0]):
                if(user_check[1]):
                    chats = ConversationModel.query.filter(ConversationModel.user_uuids.any((userAuuid)),ConversationModel.user_uuids.any((userBuuid))).all()
                    if(len(chats)==1):
                        # for chat in chats:
                        #     if (len(chat.user_uuids)==2):

                                # selected_chat = ConversationModel.query.filter_by(uuid=chat.uuid).first()
                        chat = chats[0]
                        user_uuid_idx = chat.user_uuids.index(data['uuid'])
                        chat.confirmed[user_uuid_idx] = True

                        messages = list(chat.messages)
                        message = {
                            "message_content": data['message_content'],
                            "user_uuid": data['uuid'],
                            "timestamp": datetime.datetime.utcnow().astimezone().strftime('%Y-%m-%d %H:%M:%S%z')
                        }
                        messages.append(message)
                        chat.messages = messages
                        flag_modified(chat,"messages")
                        flag_modified(chat,"confirmed")
                        # print(chat.messages)
                        db.session.commit()
                        return {"message": f"chat {chat.uuid} has been appended."}
                    else:
                        message = []
                        if "from_listing" in data:
                            user = UserModel.query.filter_by(uuid=data['uuid']  ).first()
                            user_data = {
                                    "first_name" : user.first_name,
                                    "age" : user.age,
                                    "budget" : user.budget,
                                    "interests" : user.interests,
                                    "gender_preference" : user.gender_preference,
                                    "bio" : user.bio,
                                    "registration" : user.registration,
                                    "student" : user.student,
                                    "dutch" : user.dutch,
                                    "LGBTQ" : user.LGBTQ,
                                    "image_url" : user.image_url,
                                    "languages" : user.languages,
                                }

                            user_data_str = "<div style='height:100%'>"
                            for k,v in user_data.items():

                                if(k=="image_url"):
                                    user_data_str += "<div class='image_wrapper' style='height: 14vh;display:flex;flex-wrap: wrap;'>"

                                    for image_url in v:
                                        user_data_str += "<div><a href="+str(image_url)+" class='lightbox_link' data-lightbox='user_images'><img style='height:90%;float:left;margin-left:5%;' class='gallery_img_thumb' src='"+str(image_url)+"'></a></div></br>"

                                    user_data_str += "</div>"

                                else:
                                    user_data_str += "<div>"+str(k)+" : "+str(v)+"</div></br>"
                            user_data_str += "</div>"

                            message.append({
                            "message_content": user_data_str,
                            "user_uuid": data['uuid'],
                            "timestamp": datetime.datetime.utcnow().astimezone().strftime('%Y-%m-%d %H:%M:%S%z')
                             })

                        message.append({
                            "message_content": data['message_content'],
                            "user_uuid": data['uuid'],
                            "timestamp": datetime.datetime.utcnow().astimezone().strftime('%Y-%m-%d %H:%M:%S%z')
                        })
                        # message = json.dumps(message)

                        new_convo = ConversationModel(user_uuids=[userAuuid,userBuuid],
                                                      messages=message)
                        db.session.add(new_convo)
                        db.session.commit()
                        return {"message": f"new conversation {new_convo.uuid} has been created successfully."}
                else:
                    return json.dumps({'success': False,"message": "VERIFY"}), 400, {'ContentType': 'application/json'}

            else:
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

    def generate_chat_link(self, view, request):
            data = json.loads(request.form.get('json_data'))
            if(self.checkCookies(data['uuid'],data['token'])[0]):

                #CREATE LINK TOKEN
                new_token = LinkTokenModel(item_uuid=str(data["chat_uuid"]))
                db.session.add(new_token)
                db.session.commit()
                db.session.refresh(new_token)
                link = os.environ["SERVER_URL"]+"add_user_view/"+data["chat_uuid"]+"/"+new_token.token
                return link
            else:
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

    def generate_group_link(self, view, request):
            data = json.loads(request.form.get('json_data'))
            if(self.checkCookies(data['uuid'],data['token'])[0]):

                #CREATE LINK TOKEN
                new_token = LinkTokenModel(item_uuid=str(data["group_uuid"]))
                db.session.add(new_token)
                db.session.commit()
                db.session.refresh(new_token)
                link = os.environ["SERVER_URL"]+"add_group_user_view/"+data["group_uuid"]+"/"+new_token.token
                return link
            else:
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

    def add_chat_user(self, view, request, chatuuid, token):
            data = json.loads(request.form.get('json_data'))
            if(self.checkCookies(data['uuid'],data['token'])[0]):
                if(self.checkLinkToken(chatuuid,token)):
                    chat = ConversationModel.query.filter_by(uuid=data['chat_uuid']).first()
                    chat_users = chat.user_uuids
                    chat_confirmed = chat.confirmed
                    chat_confirmed.append(True)
                    chat_users.append(data['uuid'])
                    chat.user_uuids = chat_users
                    chat.confirmed = chat_confirmed
                    flag_modified(chat,"user_uuids")
                    flag_modified(chat,"confirmed")
                    db.session.commit()
                    return {"message": f"car {chat.uuid} has been created successfully."}
            else:
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

    def add_group_user(self, view, request, groupuuid, token):
            data = json.loads(request.form.get('json_data'))
            if(self.checkCookies(data['uuid'],data['token'])[0]):
                if(self.checkLinkToken(groupuuid,token)):
                    group = UserGroupModel.query.filter_by(uuid=data['groupuuid']).first()
                    group_users = group.user_uuids
                    group_users.append(data['uuid'])
                    group.user_uuids = group_users
                    flag_modified(group,"user_uuids")
                    db.session.commit()
                    return {"message": f"car {group.uuid} has been created successfully."}
            else:
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}


    def remove_chat_user(self, view, request):
            data = json.loads(request.form.get('json_data'))

            if(self.checkCookies(data['uuid'],data['token'])[0]):
                chat = ConversationModel.query.filter_by(uuid=data['chat_uuid']).first()
                user_uuid_idx = chat.user_uuids.index(data['uuid'])

                chat_users = chat.user_uuids
                chat_users.pop(user_uuid_idx)
                chat_confirmed = chat.confirmed
                chat_confirmed.pop(user_uuid_idx)


                # group = UserGroupModel.query.filter_by(chat_uuid=data['chat_uuid']).first()
                # if(group!=None):
                #     user_uuid_idx_group = group.user_uuids.index(data['uuid'])
                #
                #     group_users = group.user_uuids
                #     group_users.pop(user_uuid_idx_group)
                #     # chat_confirmed = chat.confirmed
                #     # chat_confirmed.pop(user_uuid_idx)
                #
                #     if (len(group_users)<2):
                #         db.session.delete(group)
                #     else:
                #         group.user_uuids = group_users
                #         flag_modified(group,"user_uuids")

                if(len(chat_users)>1):
                    chat.user_uuids = chat_users
                    chat.confirmed = chat_confirmed
                    flag_modified(chat,"user_uuids")
                    flag_modified(chat,"confirmed")
                    db.session.commit()

                elif(len(chat_users)==1):
                    db.session.delete(chat)
                    db.session.commit()

                return {"message": f"car {chat.uuid} has been created successfully."}
            else:
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

    def send_message(self, view, request):
            data = json.loads(request.form.get('json_data'))
            user_check = self.checkCookies(data['uuid'],data['token'])
            global socket_users
            if(user_check[0]):
                if(user_check[1]):

                    img_tag = ""
                    image_paths = []
                    if request.files != {}:
                        for k,v in request.files.items():
                            # print("ROOT PATH : ",str())
                            f = request.files[k]
                            img_name = ran_string()
                            IMG_PATH = os.getcwd()+"/static/img/user_upload/"+img_name+".png"
                            f.save(IMG_PATH)

                            digitalocean.upload_file_to_space(
                                client,
                                "vindkamer",
                                IMG_PATH,
                                "user_upload/"+img_name+".png",
                                is_public=True
                            )

                            image_paths.append(static_img_url+img_name+".png")
                            # print(os.path.getsize(IMG_PATH))
                        #     if(os.path.getsize(IMG_PATH)>125):
                        #         image_paths[i]=static_img_url+"+img_name+".png"
                        #
                        #     i+=1
                        #
                        # for k,v in request.files.items():
                        #     f = request.files[k]
                        #     IMG_PATH = os.getcwd()+"/static/img/user_upload/"+ran_string()+".png"
                        #     f.save(IMG_PATH)

                        img_tag = '<br><br><a class="lightbox_link" data-lightbox="'+ran_string()+'" href="'+image_paths[0]+'" ><img src="'+image_paths[0]+'" style="height:200px;width:auto;"></img></a>'


                    chat = ConversationModel.query.filter_by(uuid=data['chat_uuid']).first()

                    user_uuid_idx = chat.user_uuids.index(data['uuid'])
                    chat.confirmed[user_uuid_idx] = True

                    messages = list(chat.messages)
                    message = {
                        "message_content": data['message_content']+img_tag,
                        "user_uuid": data['uuid'],
                        "timestamp": datetime.datetime.utcnow().astimezone().strftime('%Y-%m-%d %H:%M:%S%z')
                    }
                    socket_data = {}
                    socket_data["chat_uuid"] = data['chat_uuid']
                    socket_data["message"] = message
                    socket_data["message_id"] = ran_string()
                    socket_messages[socket_data["message_id"]] = chat.user_uuids
                    print("EMITTING MESSAGE")
                    socketio.emit("chat_message_sent", socket_data, json=True, to=data['chat_uuid'], callback=message_received)
                    # socketio.sleep(0)
                    messages.append(message)
                    chat.messages = messages
                    flag_modified(chat,"confirmed")
                    db.session.commit()

                    user_ids = chat.user_uuids
                    sender = UserModel.query.filter_by(uuid=data['uuid']).first()

                    for user_id in user_ids:
                        if user_id != data['uuid']:
                            user = UserModel.query.filter_by(uuid=user_id).first()
                            task_data = {}
                            task_data["email_type"] = "NOTIFY"
                            task_data["sender"] = sender.email
                            task_data["sender_name"] = sender.first_name
                            task_data["recipient"] = user.email
                            task_data["subject"] = f"Vindkamer - {sender.first_name} has sent you a new message"
                            task_data["message"] = message["message_content"]

                            if(user.email_notify and (user_id not in list(sockets.socket_users.values()))):
                                new_task = TaskModel('NOTIFY', user_id, task_data)
                                db.session.add(new_task)
                                db.session.commit()
                    # sleep(1)
                    # print("SOCKET_MESSAGES: ", socket_messages)
                    # if (not socket_messages[socket_data["message_id"]]):
                    socketio.start_background_task(socket_message_handler,socket_data,socket_data["chat_uuid"])

                    return {"message": f"car {chat.uuid} has been created successfully."}
                else:
                    return json.dumps({'success': False,"message":"VERIFY"}), 400, {'ContentType': 'application/json'}

            else:
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

    def handle_rooms(self, view, request):
        if request.method == 'POST':
            if request.is_json:
                data = request.get_json()
                if(self.checkCookies(data['uuid'],data['token'])[0]):

                    new_room = RoomModel(owner_uuid=data['owner_uuid'],
                        rent=data['rent'],
                        images=data['images'],
                        geoLoc=data['geoLoc'],
                        description=data['description'],
                        gender_preference=data['gender_preference'],
                        neighborhood=data['neighborhood'],
                        start_date=data['start_date'],
                        contract_type=data['contract_type'],
                        rooms=data['rooms'],
                        registration=data['registration'],
                        title=data['title'])

                    db.session.add(new_room)
                    db.session.commit()
                    return {"message": f"car {new_room.owner_uuid} has been created successfully."}
                else:
                    return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

            else:
                return {"error": "The request payload is not in JSON format"}

        elif request.method == 'GET':
            rooms = RoomModel.query.all()
            results = [
                {
                    "uuid": room.uuid,
                    "owner_uuid": room.owner_uuid,
                    "rent": room.rent,
                    "images": room.images,
                    "geoLoc": room.geoLoc,
                    "description": room.description,
                    "rooms": room.rooms,
                    "registration": room.registration,
                    "timestamp": room.timestamp,
                    "title": room.title

                } for room in rooms]

            return {"count": len(results), "room": results}

    def create_room(self, view, request):
            data = json.loads(request.form.get('json_data'))
            user_check = self.checkCookies(data['owner_uuid'],data['token'])
            if(user_check[0]):
                if(user_check[1]):

                    # # img_01 = request.form.get('img_01')
                    image_paths = [None] * 4
                    # for k,v in request.files.items():
                    #     f = request.files[k]
                    #     IMG_PATH = os.getcwd()+"/static/img/user_upload/"+ran_string()+".png"
                    #     f.save(IMG_PATH)
                    #     image_paths.append(IMG_PATH)
                    # image_paths = [None] * 4
                    # for i,v in enumerate(user.image_url):
                    #     image_paths[i] = v
                    i = 0
                    for k,v in request.files.items():
                        # print("ROOT PATH : ",str())
                        f = request.files[k]
                        img_name = ran_string()
                        IMG_PATH = os.getcwd()+"/static/img/user_upload/"+img_name+".png"
                        f.save(IMG_PATH)

                        # print(os.path.getsize(IMG_PATH))
                        if(os.path.getsize(IMG_PATH)>125):
                            image_paths[i]=static_img_url+img_name+".png"
                            digitalocean.upload_file_to_space(
                                client,
                                "vindkamer",
                                IMG_PATH,
                                "user_upload/"+img_name+".png",
                                is_public=True
                            )

                        i+=1

                    # data = json_data.get_json()

                    try:
                        gmaps_key = googlemaps.Client(key="AIzaSyCz4K-Ct6qrP34cUyp6WGcj5GSb8fWFMXI")
                        address = data['address']+","+ data['city']
                        g = gmaps_key.geocode(address)
                        lat =  round(g[0]["geometry"]["location"]["lat"],5)
                        long = round(g[0]["geometry"]["location"]["lng"],5)
                    except:
                        print("GEOLOC failed")
                        lat = ""
                        long = ""
                        pass
                    try:
                        start_date_str = dt.strptime(data['start_date'], '%d-%m-%Y')
                        start_date_str = start_date_str.strftime('%Y-%m-%d')
                    except:
                        start_date_str = None

                    try:
                        end_date_str = dt.strptime(data['end_date'], '%d-%m-%Y')
                        end_date_str = end_date_str.strftime('%Y-%m-%d')
                    except:
                        end_date_str = None

                    if((data['weekly_refresh'] == "false")):
                        listing_confirmed = True
                    else: listing_confirmed = False

                    data['visible']=data['visible']

                    new_room = RoomModel(owner_uuid=data['owner_uuid'],
                        rent=data['rent'],
                        images=image_paths,
                        geoLoc=[lat,long],
                        description=data['description'],
                        city=data['city'],
                        visible=data['visible'],
                        confirmed=listing_confirmed,
                        gender_preference=data['gender_preference'],
                        neighborhood=data['neighborhood'],
                        contract_type=data['contract_type'],
                        rooms=data['rooms'],
                        start_date=start_date_str,
                        end_date=end_date_str,
                        property_type=data['property_type'],
                        registration=data['registration'],
                        title=data['title'])

                    db.session.add(new_room)
                    db.session.commit()

                    return {"room_uuid": f"{new_room.uuid}"}
                else:
                    return json.dumps({'success': False,'message': "VERIFY"}), 400, {'ContentType': 'application/json'}

            else:
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}

    def create_group(self, view, request):
            data = json.loads(request.form.get('json_data'))
            user_check = self.checkCookies(data['owner_uuid'],data['token'])
            if(user_check[0]):
                if(user_check[1]):

                    new_group = UserGroupModel(user_uuids=data['user_uuids'],
                        city=data['city'],
                        chat_uuid=data['chat_uuid'],
                        gender_preference=data['gender_preference'],
                        contract_type=data['contract_type'],
                        description=data['description'],
                        owner_uuid=data['owner_uuid'],
                        dutch=parse_bool(data['dutch']),
                        rooms=data['rooms'],
                        property_type=data['property_type'],
                        registration=parse_bool(data['registration']),
                        title=data['title'])

                    db.session.add(new_group)
                    db.session.commit()
                    return {"message": f"car {new_group.owner_uuid} has been created successfully."}
                else:
                    return json.dumps({'success': False,'message': "VERIFY"}), 400, {'ContentType': 'application/json'}
            else:
                return json.dumps({'success': False,'message': "ACCOUNT"}), 400, {'ContentType': 'application/json'}

            # except:
            #     return {"message": f"SHIT'S FUCKED YO"}

    def edit_group(self, view, request):
            data = json.loads(request.form.get('json_data'))
            user_check = self.checkCookies(data['owner_uuid'],data['token'])
            if(user_check[0]):
                if(user_check[1]):
                    group = UserGroupModel.query.filter_by(uuid=data['uuid']).first()

                    if(group.owner_uuid == data['user_uuid']):

                        group.city=data['city']
                        # group.chat_uuid=data['chat_uuid']
                        group.gender_preference=data['gender_preference']
                        group.contract_type=data['contract_type']
                        group.description=data['description']
                        group.owner_uuid=data['owner_uuid']
                        group.dutch=True if data['dutch'] == "yes" else False
                        group.rooms=data['rooms']
                        group.property_type=data['property_type']
                        group.registration=True if data['registration'] == "yes" else False
                        group.title=data['title']

                        db.session.commit()
                        return {"message": f"car {group.owner_uuid} has been created successfully."}
                    else:
                        return json.dumps({'success': False,'message': "Owner not editor"}), 400, {'ContentType': 'application/json'}
                else:
                    return json.dumps({'success': False,'message': "VERIFY"}), 400, {'ContentType': 'application/json'}
            else:
                return json.dumps({'success': False,'message': "You are not a group admin"}), 400, {'ContentType': 'application/json'}


    def verifai_webhook(self, view, request):
        request_data = request.get_json()

        if(request_data["data"]["processing_status"]=="completed"):
            profile_uuid = request_data["data"]["profile_uuid"]
            internal_token = '1GiLK6uTXqj2u1nA8bvXt4QLn7HCx7eety'

            endpoint = f'api.verifai.com/v1/profile/{profile_uuid}/result'

            headers = {
              'Authorization': f'Token {internal_token}'
            }

            response = requests.get(endpoint, headers=headers)
            print(response["report"]["status"])

            if(response["report"]["status"]=="approved"):
                user_uuid = profile_uuid
                user = UserModel.query.filter_by(uuid=user_uuid).first()
                user.id_verified = True
                flag_modified(user,"id_verified")
                db.session.commit()

        return "Success", 200
